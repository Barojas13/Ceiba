using EventosVivos.Domain.Enums;

namespace EventosVivos.Application.DTOs;

public record CreateEventRequest(
    string Title,
    string Description,
    int VenueId,
    int MaxCapacity,
    DateTime StartDate,
    DateTime EndDate,
    decimal TicketPrice,
    EventType Type);

public record EventResponse(
    Guid Id,
    string Title,
    string Description,
    int VenueId,
    string VenueName,
    int MaxCapacity,
    DateTime StartDate,
    DateTime EndDate,
    decimal TicketPrice,
    EventType Type,
    EventStatus Status);

public record EventFilterRequest(
    EventType? Type = null,
    int? VenueId = null,
    EventStatus? Status = null,
    DateTime? StartDateFrom = null,
    DateTime? StartDateTo = null,
    string? TitleSearch = null);
