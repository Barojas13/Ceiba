using EventosVivos.Application.DTOs;

namespace EventosVivos.Application.Interfaces;

public interface IEventService
{
    Task<EventResponse> CreateAsync(CreateEventRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EventResponse>> GetAllAsync(EventFilterRequest filter, CancellationToken cancellationToken = default);
    Task<EventResponse> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<OccupancyReportResponse> GetOccupancyReportAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
