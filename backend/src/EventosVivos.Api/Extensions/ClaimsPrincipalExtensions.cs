using System.Security.Claims;
using EventosVivos.Application.Constants;

namespace EventosVivos.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var userId)
            ? userId
            : throw new InvalidOperationException("No se pudo obtener el usuario autenticado.");
    }

    public static bool IsAdmin(this ClaimsPrincipal user) =>
        user.IsInRole(AuthRoles.Admin);
}
