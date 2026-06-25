namespace EventosVivos.Application.Constants;

public static class BusinessRules
{
    public const decimal HighPriceThreshold = 100m;
    public const int MaxTicketsHighPrice = 10;
    public const int MaxTicketsLast24Hours = 5;
    public const int PenaltyHoursBeforeEvent = 48;
    public const int MinHoursBeforeEventToReserve = 1;
    public const int WeekendNightCutoffHour = 22;
}
