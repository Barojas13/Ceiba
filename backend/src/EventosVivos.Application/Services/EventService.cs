using EventosVivos.Application.Constants;
using EventosVivos.Application.DTOs;
using EventosVivos.Application.Exceptions;
using EventosVivos.Application.Interfaces;
using EventosVivos.Domain.Entities;
using EventosVivos.Domain.Enums;
using EventosVivos.Domain.Interfaces;
using FluentValidation;

namespace EventosVivos.Application.Services;

public class EventService : IEventService
{
    private readonly IEventRepository _eventRepository;
    private readonly IVenueRepository _venueRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<CreateEventRequest> _createValidator;

    public EventService(
        IEventRepository eventRepository,
        IVenueRepository venueRepository,
        IUnitOfWork unitOfWork,
        IValidator<CreateEventRequest> createValidator)
    {
        _eventRepository = eventRepository;
        _venueRepository = venueRepository;
        _unitOfWork = unitOfWork;
        _createValidator = createValidator;
    }

    public async Task<EventResponse> CreateAsync(CreateEventRequest request, CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);

        var venue = await _venueRepository.GetByIdAsync(request.VenueId, cancellationToken)
            ?? throw new NotFoundException("No encontramos el lugar seleccionado.");

        if (request.MaxCapacity > venue.Capacity)
        {
            throw new BusinessException("La capacidad del evento no puede superar la del lugar seleccionado.");
        }

        if (IsWeekendNightRestrictionViolated(request.StartDate))
        {
            throw new BusinessException("En fin de semana el evento no puede empezar después de las 10:00 p. m.");
        }

        var hasOverlap = await _eventRepository.HasOverlappingActiveEventAsync(
            request.VenueId,
            request.StartDate,
            request.EndDate,
            cancellationToken: cancellationToken);

        if (hasOverlap)
        {
            throw new BusinessException("Ya hay otro evento activo en este lugar con el mismo horario.");
        }

        var entity = new Event
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            VenueId = request.VenueId,
            MaxCapacity = request.MaxCapacity,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TicketPrice = request.TicketPrice,
            Type = request.Type,
            Status = EventStatus.Activo
        };

        await _eventRepository.AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(entity, venue.Name);
    }

    public async Task<IReadOnlyList<EventResponse>> GetAllAsync(EventFilterRequest filter, CancellationToken cancellationToken = default)
    {
        var events = await _eventRepository.GetAllAsync(
            filter.Type,
            filter.VenueId,
            filter.Status,
            filter.StartDateFrom,
            filter.StartDateTo,
            filter.TitleSearch,
            cancellationToken);

        var responses = new List<EventResponse>();

        foreach (var entity in events)
        {
            EventStatusUpdater.UpdateIfCompleted(entity);

            if (entity.Status == EventStatus.Completado)
            {
                await _eventRepository.UpdateAsync(entity, cancellationToken);
            }

            responses.Add(MapToResponse(entity, entity.Venue.Name));
        }

        if (events.Any(e => e.Status == EventStatus.Completado))
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return responses;
    }

    public async Task<EventResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _eventRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("No encontramos ese evento.");

        EventStatusUpdater.UpdateIfCompleted(entity);

        if (entity.Status == EventStatus.Completado)
        {
            await _eventRepository.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return MapToResponse(entity, entity.Venue.Name);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _eventRepository.GetByIdWithReservationsAsync(id, cancellationToken)
            ?? throw new NotFoundException("No encontramos ese evento.");

        await _eventRepository.DeleteAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<OccupancyReportResponse> GetOccupancyReportAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        var entity = await _eventRepository.GetByIdWithReservationsAsync(eventId, cancellationToken)
            ?? throw new NotFoundException("No encontramos ese evento.");

        EventStatusUpdater.UpdateIfCompleted(entity);

        if (entity.Status == EventStatus.Completado)
        {
            await _eventRepository.UpdateAsync(entity, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var confirmedTickets = entity.Reservations
            .Where(r => r.Status == ReservationStatus.Confirmada)
            .Sum(r => r.Quantity);

        var pendingTickets = entity.Reservations
            .Where(r => r.Status == ReservationStatus.PendientePago)
            .Sum(r => r.Quantity);

        var lostTickets = entity.Reservations.Sum(r => r.LostTickets);

        var availableTickets = Math.Max(0, entity.MaxCapacity - confirmedTickets - pendingTickets - lostTickets);

        var occupancyPercentage = entity.MaxCapacity == 0
            ? 0
            : Math.Round((decimal)confirmedTickets / entity.MaxCapacity * 100, 2);

        var totalRevenue = confirmedTickets * entity.TicketPrice;

        var cancelledReservations = entity.Reservations
            .Where(r => r.Status == ReservationStatus.Cancelada)
            .OrderByDescending(r => r.CancelledAt)
            .Select(r => new CancelledReservationSummary(
                r.Id,
                r.BuyerName,
                r.Quantity,
                r.CancelledAt,
                r.LostTickets))
            .ToList();

        return new OccupancyReportResponse(
            entity.Id,
            entity.Title,
            confirmedTickets,
            pendingTickets,
            lostTickets,
            availableTickets,
            occupancyPercentage,
            totalRevenue,
            entity.Status,
            cancelledReservations);
    }

    private static bool IsWeekendNightRestrictionViolated(DateTime startDate)
    {
        var isWeekend = startDate.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday;
        return isWeekend && startDate.TimeOfDay > new TimeSpan(BusinessRules.WeekendNightCutoffHour, 0, 0);
    }

    private static EventResponse MapToResponse(Event entity, string venueName) =>
        new(
            entity.Id,
            entity.Title,
            entity.Description,
            entity.VenueId,
            venueName,
            entity.MaxCapacity,
            entity.StartDate,
            entity.EndDate,
            entity.TicketPrice,
            entity.Type,
            entity.Status);
}
