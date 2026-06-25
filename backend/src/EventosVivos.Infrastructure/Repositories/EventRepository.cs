using EventosVivos.Domain.Entities;
using EventosVivos.Domain.Enums;
using EventosVivos.Domain.Interfaces;
using EventosVivos.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EventosVivos.Infrastructure.Repositories;

public class EventRepository : IEventRepository
{
    private readonly AppDbContext _context;

    public EventRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Event?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _context.Events
            .Include(e => e.Venue)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

    public async Task<Event?> GetByIdWithReservationsAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _context.Events
            .Include(e => e.Venue)
            .Include(e => e.Reservations)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Event>> GetAllAsync(
        EventType? type,
        int? venueId,
        EventStatus? status,
        DateTime? startDateFrom,
        DateTime? startDateTo,
        string? titleSearch,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Events
            .Include(e => e.Venue)
            .AsQueryable();

        if (type.HasValue)
        {
            query = query.Where(e => e.Type == type.Value);
        }

        if (venueId.HasValue)
        {
            query = query.Where(e => e.VenueId == venueId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(e => e.Status == status.Value);
        }

        if (startDateFrom.HasValue)
        {
            query = query.Where(e => e.StartDate >= startDateFrom.Value);
        }

        if (startDateTo.HasValue)
        {
            query = query.Where(e => e.StartDate <= startDateTo.Value);
        }

        if (!string.IsNullOrWhiteSpace(titleSearch))
        {
            query = query.Where(e => EF.Functions.Like(e.Title.ToLower(), $"%{titleSearch.Trim().ToLower()}%"));
        }

        return await query
            .OrderBy(e => e.StartDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> HasOverlappingActiveEventAsync(
        int venueId,
        DateTime startDate,
        DateTime endDate,
        Guid? excludeEventId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Events
            .Where(e => e.VenueId == venueId)
            .Where(e => e.Status == EventStatus.Activo)
            .Where(e => startDate < e.EndDate && endDate > e.StartDate);

        if (excludeEventId.HasValue)
        {
            query = query.Where(e => e.Id != excludeEventId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task AddAsync(Event entity, CancellationToken cancellationToken = default)
    {
        await _context.Events.AddAsync(entity, cancellationToken);
    }

    public Task UpdateAsync(Event entity, CancellationToken cancellationToken = default)
    {
        _context.Events.Update(entity);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Event entity, CancellationToken cancellationToken = default)
    {
        _context.Events.Remove(entity);
        return Task.CompletedTask;
    }
}
