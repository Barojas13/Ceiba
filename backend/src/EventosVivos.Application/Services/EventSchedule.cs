namespace EventosVivos.Application.Services;

internal static class EventSchedule
{
    public static TimeSpan TimeUntilStart(DateTime startDate) =>
        startDate - ResolveNow(startDate);

    public static bool IsInTheFuture(DateTime startDate) =>
        startDate > ResolveNow(startDate);

    private static DateTime ResolveNow(DateTime reference) =>
        reference.Kind == DateTimeKind.Utc ? DateTime.UtcNow : DateTime.Now;
}
