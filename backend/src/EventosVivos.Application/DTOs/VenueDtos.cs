namespace EventosVivos.Application.DTOs;

public record VenueResponse(
    int Id,
    string Name,
    int Capacity,
    string City);
