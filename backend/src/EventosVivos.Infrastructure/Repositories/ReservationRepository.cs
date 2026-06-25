using EventosVivos.Domain.Entities;
using EventosVivos.Domain.Interfaces;
using EventosVivos.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace EventosVivos.Infrastructure.Repositories;

public class ReservationRepository : IReservationRepository
{
    private readonly AppDbContext _context;

    public ReservationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Reservation?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _context.Reservations
            .Include(r => r.Event)
            .ThenInclude(e => e.Venue)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Reservation>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await _context.Reservations
            .Include(r => r.Event)
            .ThenInclude(e => e.Venue)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<bool> ReservationCodeExistsAsync(string code, CancellationToken cancellationToken = default) =>
        await _context.Reservations.AnyAsync(r => r.ReservationCode == code, cancellationToken);

    public async Task AddAsync(Reservation entity, CancellationToken cancellationToken = default)
    {
        await _context.Reservations.AddAsync(entity, cancellationToken);
    }

    public Task UpdateAsync(Reservation entity, CancellationToken cancellationToken = default)
    {
        _context.Reservations.Update(entity);
        return Task.CompletedTask;
    }
}
