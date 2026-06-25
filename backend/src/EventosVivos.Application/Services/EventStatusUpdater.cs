using EventosVivos.Domain.Entities;
using EventosVivos.Domain.Enums;

namespace EventosVivos.Application.Services;

internal static class EventStatusUpdater
{
    public static void UpdateIfCompleted(Event entity)
    {
        var now = entity.EndDate.Kind == DateTimeKind.Utc ? DateTime.UtcNow : DateTime.Now;

        if (entity.Status == EventStatus.Activo && now > entity.EndDate)
        {
            entity.Status = EventStatus.Completado;
        }
    }
}
