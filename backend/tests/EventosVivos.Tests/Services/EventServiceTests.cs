using EventosVivos.Application.DTOs;
using EventosVivos.Application.Exceptions;
using EventosVivos.Application.Services;
using EventosVivos.Domain.Entities;
using EventosVivos.Domain.Enums;
using EventosVivos.Domain.Interfaces;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using Moq;

namespace EventosVivos.Tests.Services;

public class EventServiceTests
{
    private readonly Mock<IEventRepository> _eventRepository = new();
    private readonly Mock<IVenueRepository> _venueRepository = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly Mock<IValidator<CreateEventRequest>> _validator = new();

    public EventServiceTests()
    {
        _validator
            .Setup(v => v.ValidateAsync(It.IsAny<CreateEventRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult());
    }

    [Fact]
    public async Task CreateAsync_ShouldRejectCapacityGreaterThanVenue()
    {
        var venue = new Venue { Id = 1, Name = "Auditorio Central", Capacity = 200, City = "Bogotá" };
        _venueRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(venue);

        var service = CreateService();
        var request = BuildValidRequest(maxCapacity: 250);

        var act = () => service.CreateAsync(request);

        await act.Should().ThrowAsync<BusinessException>()
            .WithMessage("*lugar seleccionado*");
    }

    [Fact]
    public async Task CreateAsync_ShouldRejectWeekendEventAfter22()
    {
        var venue = new Venue { Id = 1, Name = "Auditorio Central", Capacity = 200, City = "Bogotá" };
        _venueRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(venue);

        var nextSaturday = GetNextWeekday(DayOfWeek.Saturday);
        var service = CreateService();
        var request = BuildValidRequest(
            startDate: nextSaturday.Date.AddHours(23),
            endDate: nextSaturday.Date.AddHours(25));

        var act = () => service.CreateAsync(request);

        await act.Should().ThrowAsync<BusinessException>()
            .WithMessage("*10:00*");
    }

    [Fact]
    public async Task CreateAsync_ShouldRejectOverlappingEvents()
    {
        var venue = new Venue { Id = 1, Name = "Auditorio Central", Capacity = 200, City = "Bogotá" };
        _venueRepository.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(venue);
        _eventRepository
            .Setup(r => r.HasOverlappingActiveEventAsync(1, It.IsAny<DateTime>(), It.IsAny<DateTime>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var service = CreateService();
        var act = () => service.CreateAsync(BuildValidRequest());

        await act.Should().ThrowAsync<BusinessException>()
            .WithMessage("*mismo horario*");
    }

    [Fact]
    public async Task GetByIdAsync_ShouldMarkEventAsCompletedWhenEndDatePassed()
    {
        var entity = new Event
        {
            Id = Guid.NewGuid(),
            Title = "Evento finalizado",
            Description = "Descripcion del evento finalizado",
            VenueId = 1,
            MaxCapacity = 100,
            StartDate = DateTime.Now.AddDays(-2),
            EndDate = DateTime.Now.AddHours(-1),
            TicketPrice = 50m,
            Type = EventType.Conferencia,
            Status = EventStatus.Activo,
            Venue = new Venue { Id = 1, Name = "Auditorio Central", Capacity = 200, City = "Bogotá" }
        };

        _eventRepository
            .Setup(r => r.GetByIdAsync(entity.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        var service = CreateService();
        var result = await service.GetByIdAsync(entity.Id);

        result.Status.Should().Be(EventStatus.Completado);
        _eventRepository.Verify(r => r.UpdateAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ShouldRemoveEvent()
    {
        var entity = new Event
        {
            Id = Guid.NewGuid(),
            Title = "Evento a eliminar",
            Description = "Descripcion del evento a eliminar",
            VenueId = 1,
            MaxCapacity = 100,
            StartDate = DateTime.UtcNow.AddDays(7),
            EndDate = DateTime.UtcNow.AddDays(7).AddHours(2),
            TicketPrice = 50m,
            Type = EventType.Conferencia,
            Status = EventStatus.Activo,
            Venue = new Venue { Id = 1, Name = "Auditorio Central", Capacity = 200, City = "Bogotá" },
            Reservations = []
        };

        _eventRepository
            .Setup(r => r.GetByIdWithReservationsAsync(entity.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        var service = CreateService();
        await service.DeleteAsync(entity.Id);

        _eventRepository.Verify(r => r.DeleteAsync(entity, It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWork.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    private EventService CreateService() =>
        new(_eventRepository.Object, _venueRepository.Object, _unitOfWork.Object, _validator.Object);

    private static CreateEventRequest BuildValidRequest(
        int maxCapacity = 100,
        DateTime? startDate = null,
        DateTime? endDate = null) =>
        new(
            "Conferencia de Arquitectura",
            "Descripcion valida del evento de prueba",
            1,
            maxCapacity,
            startDate ?? DateTime.UtcNow.AddDays(7),
            endDate ?? DateTime.UtcNow.AddDays(7).AddHours(2),
            50m,
            EventType.Conferencia);

    private static DateTime GetNextWeekday(DayOfWeek day)
    {
        var date = DateTime.UtcNow.Date;
        while (date.DayOfWeek != day)
        {
            date = date.AddDays(1);
        }

        return date;
    }
}
