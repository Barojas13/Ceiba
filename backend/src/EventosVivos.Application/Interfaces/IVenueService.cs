using EventosVivos.Application.DTOs;

namespace EventosVivos.Application.Interfaces;

public interface IVenueService
{
    Task<IReadOnlyList<VenueResponse>> GetAllAsync(CancellationToken cancellationToken = default);
}
