using EventosVivos.Domain.Entities;
using EventosVivos.Domain.Enums;

namespace EventosVivos.Domain.Interfaces;

public interface IEventRepository
{
    Task<Event?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Event?> GetByIdWithReservationsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Event>> GetAllAsync(
        EventType? type,
        int? venueId,
        EventStatus? status,
        DateTime? startDateFrom,
        DateTime? startDateTo,
        string? titleSearch,
        CancellationToken cancellationToken = default);
    Task<bool> HasOverlappingActiveEventAsync(
        int venueId,
        DateTime startDate,
        DateTime endDate,
        Guid? excludeEventId = null,
        CancellationToken cancellationToken = default);
    Task AddAsync(Event entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(Event entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(Event entity, CancellationToken cancellationToken = default);
}
