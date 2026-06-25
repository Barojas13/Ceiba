using EventosVivos.Application.Interfaces;
using EventosVivos.Application.Services;
using EventosVivos.Application.Validators;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace EventosVivos.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssemblyContaining<CreateEventRequestValidator>();

        services.AddScoped<IEventService, EventService>();
        services.AddScoped<IReservationService, ReservationService>();
        services.AddScoped<IVenueService, VenueService>();
        services.AddScoped<IAuthService, AuthService>();

        return services;
    }
}
