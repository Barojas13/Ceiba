using EventosVivos.Application.DTOs;
using FluentValidation;

namespace EventosVivos.Application.Validators;

public class CreateReservationRequestValidator : AbstractValidator<CreateReservationRequest>
{
    public CreateReservationRequestValidator()
    {
        RuleFor(x => x.EventId)
            .NotEmpty()
            .WithMessage("Selecciona un evento válido.");

        RuleFor(x => x.Quantity)
            .GreaterThanOrEqualTo(1)
            .WithMessage("La cantidad debe ser al menos 1.");
    }
}
