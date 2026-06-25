namespace EventosVivos.Application.DTOs;

public record LoginRequest(string Username, string Password);

public record RegisterRequest(
    string FullName,
    string Email,
    string Password);

public record LoginResponse(
    string Token,
    string TokenType,
    DateTime ExpiresAt,
    string Role,
    Guid UserId,
    string FullName,
    string Email);

public record UserProfileResponse(
    Guid Id,
    string FullName,
    string Email,
    string Role);
