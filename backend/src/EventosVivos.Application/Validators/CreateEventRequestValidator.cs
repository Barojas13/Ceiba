using EventosVivos.Application.DTOs;
using EventosVivos.Application.Services;
using FluentValidation;

namespace EventosVivos.Application.Validators;

public class CreateEventRequestValidator : AbstractValidator<CreateEventRequest>
{
    public CreateEventRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Ingresa un título.")
            .Length(5, 100)
            .WithMessage("El título debe tener entre 5 y 100 caracteres.");

        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Ingresa una descripción.")
            .Length(10, 500)
            .WithMessage("La descripción debe tener entre 10 y 500 caracteres.");

        RuleFor(x => x.VenueId)
            .GreaterThan(0)
            .WithMessage("Selecciona un lugar.");

        RuleFor(x => x.MaxCapacity)
            .GreaterThan(0)
            .WithMessage("La capacidad debe ser mayor a 0.");

        RuleFor(x => x.StartDate)
            .Must(EventSchedule.IsInTheFuture)
            .WithMessage("La fecha de inicio debe ser posterior a la hora actual.");

        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate)
            .WithMessage("La fecha de fin debe ser posterior a la fecha de inicio.");

        RuleFor(x => x.TicketPrice)
            .GreaterThan(0)
            .WithMessage("El precio debe ser mayor a 0.");
    }
}
