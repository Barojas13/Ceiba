using EventosVivos.Domain.Enums;

namespace EventosVivos.Domain.Entities;

public class Reservation
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public Guid? UserId { get; set; }
    public int Quantity { get; set; }
    public string BuyerName { get; set; } = string.Empty;
    public string BuyerEmail { get; set; } = string.Empty;
    public ReservationStatus Status { get; set; }
    public string? ReservationCode { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public int LostTickets { get; set; }

    public Event Event { get; set; } = null!;
    public User? User { get; set; }
}
