using EventosVivos.Application.DTOs;
using FluentValidation;

namespace EventosVivos.Application.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty()
            .WithMessage("Ingresa tu nombre completo.")
            .MaximumLength(200);

        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("Ingresa tu correo electrónico.")
            .EmailAddress()
            .WithMessage("Ingresa un correo electrónico válido.");

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("Ingresa una contraseña.")
            .MinimumLength(6)
            .WithMessage("La contraseña debe tener al menos 6 caracteres.");
    }
}
