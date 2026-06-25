using EventosVivos.Application.DTOs;
using EventosVivos.Application.Exceptions;
using EventosVivos.Application.Services;
using EventosVivos.Application.Validators;
using EventosVivos.Domain.Entities;
using EventosVivos.Domain.Enums;
using EventosVivos.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace EventosVivos.Tests.Services;

public class ReservationServiceTests
{
    private readonly Mock<IReservationRepository> _reservationRepository = new();
    private readonly Mock<IEventRepository> _eventRepository = new();
    private readonly Mock<IUserRepository> _userRepository = new();
    private readonly Mock<IUnitOfWork> _unitOfWork = new();
    private readonly CreateReservationRequestValidator _validator = new();
    private readonly Guid _userId = Guid.NewGuid();

    public ReservationServiceTests()
    {
        _userRepository
            .Setup(r => r.GetByIdAsync(_userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = _userId,
                FullName = "Juan Perez",
                Email = "juan@test.com",
                Username = "juan@test.com",
                Role = "User"
            });
    }

    [Fact]
    public async Task CreateAsync_ShouldRejectReservationWithinOneHour()
    {
        var entity = BuildEvent(startsInHours: 0.5);
        _eventRepository
            .Setup(r => r.GetByIdWithReservationsAsync(entity.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        var service = CreateService();
        var request = new CreateReservationRequest(entity.Id, 1);

        var act = () => service.CreateAsync(request, _userId);

        await act.Should().ThrowAsync<BusinessException>()
            .WithMessage("*menos de 1 hora*");
    }

    [Fact]
    public async Task CreateAsync_ShouldLimitToFiveTicketsWhenEventStartsInLessThan24Hours()
    {
        var entity = BuildEvent(startsInHours: 12, ticketPrice: 150m);
        _eventRepository
            .Setup(r => r.GetByIdWithReservationsAsync(entity.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        var service = CreateService();
        var request = new CreateReservationRequest(entity.Id, 6);

        var act = () => service.CreateAsync(request, _userId);

        await act.Should().ThrowAsync<BusinessException>()
            .WithMessage("*5 entradas*");
    }

    [Fact]
    public async Task CreateAsync_ShouldLimitToTenTicketsForHighPriceEvents()
    {
        var entity = BuildEvent(startsInHours: 48, ticketPrice: 150m);
        _eventRepository
            .Setup(r => r.GetByIdWithReservationsAsync(entity.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(entity);

        var service = CreateService();
        var request = new CreateReservationRequest(entity.Id, 11);

        var act = () => service.CreateAsync(request, _userId);

        await act.Should().ThrowAsync<BusinessException>()
            .WithMessage("*10 entradas*");
    }

    [Fact]
    public async Task CancelAsync_ShouldNotMarkTicketsAsLostWhenMoreThan48Hours()
    {
        var entity = BuildEvent(startsInHours: 72);
        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            EventId = entity.Id,
            UserId = _userId,
            Event = entity,
            Quantity = 2,
            BuyerName = "Juan Perez",
            BuyerEmail = "juan@test.com",
            Status = ReservationStatus.Confirmada,
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };

        _reservationRepository
            .Setup(r => r.GetByIdAsync(reservation.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(reservation);

        var service = CreateService();
        var result = await service.CancelAsync(reservation.Id, _userId, false);

        result.Status.Should().Be(ReservationStatus.Cancelada);
        result.LostTickets.Should().Be(0);
    }

    [Fact]
    public async Task CancelAsync_ShouldMarkTicketsAsLostWhenWithin48Hours()
    {
        var entity = BuildEvent(startsInHours: 24);
        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            EventId = entity.Id,
            UserId = _userId,
            Event = entity,
            Quantity = 2,
            BuyerName = "Juan Perez",
            BuyerEmail = "juan@test.com",
            Status = ReservationStatus.Confirmada,
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };

        _reservationRepository
            .Setup(r => r.GetByIdAsync(reservation.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(reservation);

        var service = CreateService();
        var result = await service.CancelAsync(reservation.Id, _userId, false);

        result.Status.Should().Be(ReservationStatus.Cancelada);
        result.LostTickets.Should().Be(2);
        result.CancelledAt.Should().NotBeNull();
    }

    [Fact]
    public async Task ConfirmPaymentAsync_ShouldRejectAlreadyConfirmedReservation()
    {
        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            EventId = Guid.NewGuid(),
            Quantity = 1,
            Status = ReservationStatus.Confirmada,
            ReservationCode = "EV-123456"
        };

        _reservationRepository
            .Setup(r => r.GetByIdAsync(reservation.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(reservation);

        var service = CreateService();
        var act = () => service.ConfirmPaymentAsync(reservation.Id);

        await act.Should().ThrowAsync<BusinessException>()
            .WithMessage("*ya está confirmada*");
    }

    private ReservationService CreateService() =>
        new(
            _reservationRepository.Object,
            _eventRepository.Object,
            _userRepository.Object,
            _unitOfWork.Object,
            _validator);

    private static Event BuildEvent(double startsInHours, decimal ticketPrice = 50m)
    {
        var startDate = DateTime.UtcNow.AddHours(startsInHours);
        return new Event
        {
            Id = Guid.NewGuid(),
            Title = "Evento de prueba",
            Description = "Descripcion del evento de prueba",
            VenueId = 1,
            MaxCapacity = 100,
            StartDate = startDate,
            EndDate = startDate.AddHours(2),
            TicketPrice = ticketPrice,
            Type = EventType.Conferencia,
            Status = EventStatus.Activo,
            Venue = new Venue { Id = 1, Name = "Auditorio Central", Capacity = 200, City = "Bogotá" },
            Reservations = new List<Reservation>()
        };
    }
}
