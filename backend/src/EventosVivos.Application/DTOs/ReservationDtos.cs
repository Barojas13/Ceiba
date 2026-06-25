using EventosVivos.Domain.Enums;

namespace EventosVivos.Application.DTOs;

public record CreateReservationRequest(
    Guid EventId,
    int Quantity);

public record ReservationResponse(
    Guid Id,
    Guid EventId,
    int Quantity,
    string BuyerName,
    string BuyerEmail,
    ReservationStatus Status,
    string? ReservationCode,
    DateTime CreatedAt,
    DateTime? CancelledAt,
    int LostTickets,
    string? EventTitle = null,
    decimal? TicketPrice = null,
    DateTime? EventStartDate = null);

public record CancelledReservationSummary(
    Guid Id,
    string BuyerName,
    int Quantity,
    DateTime? CancelledAt,
    int LostTickets);

public record OccupancyReportResponse(
    Guid EventId,
    string EventTitle,
    int TotalSoldTickets,
    int PendingTickets,
    int LostTickets,
    int AvailableTickets,
    decimal OccupancyPercentage,
    decimal TotalRevenue,
    EventStatus Status,
    IReadOnlyList<CancelledReservationSummary> CancelledReservations);
