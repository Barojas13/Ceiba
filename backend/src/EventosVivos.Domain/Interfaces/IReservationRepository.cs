using EventosVivos.Domain.Entities;

namespace EventosVivos.Domain.Interfaces;

public interface IReservationRepository
{
    Task<Reservation?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Reservation>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> ReservationCodeExistsAsync(string code, CancellationToken cancellationToken = default);
    Task AddAsync(Reservation entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(Reservation entity, CancellationToken cancellationToken = default);
}
