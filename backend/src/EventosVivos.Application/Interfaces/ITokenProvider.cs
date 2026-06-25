namespace EventosVivos.Application.Interfaces;

public interface ITokenProvider
{
    string GenerateToken(Guid userId, string username, string role, DateTime expiresAt);
}
