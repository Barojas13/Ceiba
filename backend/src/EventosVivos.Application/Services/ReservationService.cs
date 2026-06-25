using EventosVivos.Application.Constants;
using EventosVivos.Application.DTOs;
using EventosVivos.Application.Exceptions;
using EventosVivos.Application.Interfaces;
using EventosVivos.Domain.Entities;
using EventosVivos.Domain.Enums;
using EventosVivos.Domain.Interfaces;
using FluentValidation;

namespace EventosVivos.Application.Services;

public class ReservationService : IReservationService
{
    private readonly IReservationRepository _reservationRepository;
    private readonly IEventRepository _eventRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<CreateReservationRequest> _createValidator;

    public ReservationService(
        IReservationRepository reservationRepository,
        IEventRepository eventRepository,
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        IValidator<CreateReservationRequest> createValidator)
    {
        _reservationRepository = reservationRepository;
        _eventRepository = eventRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _createValidator = createValidator;
    }

    public async Task<ReservationResponse> CreateAsync(
        CreateReservationRequest request,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await _createValidator.ValidateAndThrowAsync(request, cancellationToken);

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("No encontramos tu cuenta.");

        var entity = await _eventRepository.GetByIdWithReservationsAsync(request.EventId, cancellationToken)
            ?? throw new NotFoundException("No encontramos ese evento.");

        EventStatusUpdater.UpdateIfCompleted(entity);

        if (entity.Status != EventStatus.Activo)
        {
            throw new BusinessException("Este evento no admite reservas.");
        }

        var timeUntilStart = EventSchedule.TimeUntilStart(entity.StartDate);

        if (timeUntilStart < TimeSpan.FromHours(BusinessRules.MinHoursBeforeEventToReserve))
        {
            throw new BusinessException("El evento empieza en menos de 1 hora. Ya no es posible reservar.");
        }

        ValidateTransactionLimits(entity, request.Quantity);

        var occupiedTickets = GetOccupiedTickets(entity);
        var availableTickets = entity.MaxCapacity - occupiedTickets;

        if (request.Quantity > availableTickets)
        {
            throw new BusinessException($"Solo quedan {availableTickets} entradas disponibles.");
        }

        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            EventId = request.EventId,
            UserId = userId,
            Quantity = request.Quantity,
            BuyerName = user.FullName,
            BuyerEmail = user.Email,
            Status = ReservationStatus.PendientePago,
            CreatedAt = DateTime.UtcNow,
            LostTickets = 0
        };

        await _reservationRepository.AddAsync(reservation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(reservation, entity);
    }

    public async Task<ReservationResponse> ConfirmPaymentAsync(Guid reservationId, CancellationToken cancellationToken = default)
    {
        var reservation = await _reservationRepository.GetByIdAsync(reservationId, cancellationToken)
            ?? throw new NotFoundException("No encontramos esa reserva.");

        return await CompletePaymentAsync(reservation, cancellationToken);
    }

    public async Task<ReservationResponse> PayAsync(
        Guid reservationId,
        Guid userId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var reservation = await _reservationRepository.GetByIdAsync(reservationId, cancellationToken)
            ?? throw new NotFoundException("No encontramos esa reserva.");

        EnsureCanAccessReservation(reservation, userId, isAdmin);

        if (reservation.Status != ReservationStatus.PendientePago)
        {
            throw new BusinessException("Esta reserva ya no está pendiente de pago.");
        }

        return await CompletePaymentAsync(reservation, cancellationToken);
    }

    private async Task<ReservationResponse> CompletePaymentAsync(
        Reservation reservation,
        CancellationToken cancellationToken)
    {
        if (reservation.Status == ReservationStatus.Confirmada)
        {
            throw new BusinessException("Esta reserva ya está confirmada.");
        }

        if (reservation.Status == ReservationStatus.Cancelada)
        {
            throw new BusinessException("No puedes pagar una reserva cancelada.");
        }

        reservation.Status = ReservationStatus.Confirmada;
        reservation.ReservationCode = await GenerateUniqueReservationCodeAsync(cancellationToken);

        await _reservationRepository.UpdateAsync(reservation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(reservation);
    }

    public async Task<ReservationResponse> CancelAsync(
        Guid reservationId,
        Guid userId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var reservation = await _reservationRepository.GetByIdAsync(reservationId, cancellationToken)
            ?? throw new NotFoundException("No encontramos esa reserva.");

        EnsureCanAccessReservation(reservation, userId, isAdmin);

        if (reservation.Status == ReservationStatus.Cancelada)
        {
            throw new BusinessException("Esta reserva ya fue cancelada.");
        }

        if (reservation.Status == ReservationStatus.PendientePago)
        {
            throw new BusinessException("Solo puedes cancelar reservas que ya estén pagadas.");
        }

        var timeUntilEvent = EventSchedule.TimeUntilStart(reservation.Event.StartDate);
        var isPenalized = timeUntilEvent < TimeSpan.FromHours(BusinessRules.PenaltyHoursBeforeEvent);

        reservation.Status = ReservationStatus.Cancelada;
        reservation.CancelledAt = DateTime.UtcNow;
        reservation.LostTickets = isPenalized ? reservation.Quantity : 0;

        await _reservationRepository.UpdateAsync(reservation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(reservation);
    }

    public async Task<ReservationResponse> GetByIdAsync(
        Guid id,
        Guid userId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var reservation = await _reservationRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException("No encontramos esa reserva.");

        EnsureCanAccessReservation(reservation, userId, isAdmin);
        return MapToResponse(reservation);
    }

    public async Task<IReadOnlyList<ReservationResponse>> GetMyReservationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var reservations = await _reservationRepository.GetByUserIdAsync(userId, cancellationToken);
        return reservations.Select(r => MapToResponse(r)).ToList();
    }

    private static void EnsureCanAccessReservation(Reservation reservation, Guid userId, bool isAdmin)
    {
        if (isAdmin)
        {
            return;
        }

        if (reservation.UserId != userId)
        {
            throw new BusinessException("No tienes permiso para ver o modificar esta reserva.");
        }
    }

    private static void ValidateTransactionLimits(Event entity, int quantity)
    {
        var timeUntilStart = EventSchedule.TimeUntilStart(entity.StartDate);

        if (timeUntilStart < TimeSpan.FromHours(24))
        {
            if (quantity > BusinessRules.MaxTicketsLast24Hours)
            {
                throw new BusinessException(
                    $"Como el evento empieza pronto, solo puedes reservar hasta {BusinessRules.MaxTicketsLast24Hours} entradas por compra.");
            }

            return;
        }

        if (entity.TicketPrice > BusinessRules.HighPriceThreshold && quantity > BusinessRules.MaxTicketsHighPrice)
        {
            throw new BusinessException(
                $"Solo puedes reservar hasta {BusinessRules.MaxTicketsHighPrice} entradas por compra en este evento.");
        }
    }

    private static int GetOccupiedTickets(Event entity)
    {
        var reservedOrConfirmed = entity.Reservations
            .Where(r => r.Status is ReservationStatus.PendientePago or ReservationStatus.Confirmada)
            .Sum(r => r.Quantity);

        var lostTickets = entity.Reservations.Sum(r => r.LostTickets);

        return reservedOrConfirmed + lostTickets;
    }

    private async Task<string> GenerateUniqueReservationCodeAsync(CancellationToken cancellationToken)
    {
        const int maxAttempts = 10;

        for (var attempt = 0; attempt < maxAttempts; attempt++)
        {
            var code = $"EV-{Random.Shared.Next(0, 1_000_000):D6}";

            if (!await _reservationRepository.ReservationCodeExistsAsync(code, cancellationToken))
            {
                return code;
            }
        }

        throw new BusinessException("No pudimos generar el código de reserva. Intenta de nuevo.");
    }

    private static ReservationResponse MapToResponse(Reservation reservation, Event? eventEntity = null)
    {
        var eventData = eventEntity ?? reservation.Event;
        return new ReservationResponse(
            reservation.Id,
            reservation.EventId,
            reservation.Quantity,
            reservation.BuyerName,
            reservation.BuyerEmail,
            reservation.Status,
            reservation.ReservationCode,
            reservation.CreatedAt,
            reservation.CancelledAt,
            reservation.LostTickets,
            eventData?.Title,
            eventData?.TicketPrice,
            eventData?.StartDate);
    }
}
