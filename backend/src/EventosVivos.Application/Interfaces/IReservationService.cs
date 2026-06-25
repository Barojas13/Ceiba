using EventosVivos.Application.DTOs;

namespace EventosVivos.Application.Interfaces;

public interface IReservationService
{
    Task<ReservationResponse> CreateAsync(CreateReservationRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<ReservationResponse> ConfirmPaymentAsync(Guid reservationId, CancellationToken cancellationToken = default);
    Task<ReservationResponse> PayAsync(Guid reservationId, Guid userId, bool isAdmin, CancellationToken cancellationToken = default);
    Task<ReservationResponse> CancelAsync(Guid reservationId, Guid userId, bool isAdmin, CancellationToken cancellationToken = default);
    Task<ReservationResponse> GetByIdAsync(Guid id, Guid userId, bool isAdmin, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ReservationResponse>> GetMyReservationsAsync(Guid userId, CancellationToken cancellationToken = default);
}
