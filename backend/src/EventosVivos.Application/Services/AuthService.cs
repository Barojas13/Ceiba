using EventosVivos.Application.Constants;
using EventosVivos.Application.DTOs;
using EventosVivos.Application.Exceptions;
using EventosVivos.Application.Interfaces;
using EventosVivos.Application.Options;
using EventosVivos.Application.Security;
using EventosVivos.Domain.Entities;
using EventosVivos.Domain.Interfaces;
using Microsoft.Extensions.Options;

namespace EventosVivos.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenProvider _tokenProvider;
    private readonly AdminCredentialsOptions _adminCredentials;
    private readonly int _expirationMinutes;

    public AuthService(
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        ITokenProvider tokenProvider,
        IOptions<AdminCredentialsOptions> adminCredentials,
        IOptions<JwtOptions> jwtOptions)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _tokenProvider = tokenProvider;
        _adminCredentials = adminCredentials.Value;
        _expirationMinutes = jwtOptions.Value.ExpirationMinutes;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var username = request.Username.Trim();
        var user = await _userRepository.GetByUsernameAsync(username, cancellationToken)
            ?? await _userRepository.GetByEmailAsync(username, cancellationToken);

        if (user is not null)
        {
            if (!PasswordHasher.Verify(request.Password, user.PasswordHash))
            {
                return null;
            }

            return BuildLoginResponse(user);
        }

        if (username != _adminCredentials.Username || request.Password != _adminCredentials.Password)
        {
            return null;
        }

        var adminUser = await EnsureAdminUserAsync(cancellationToken);
        return BuildLoginResponse(adminUser);
    }

    public async Task<LoginResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var fullName = request.FullName.Trim();

        if (await _userRepository.GetByEmailAsync(email, cancellationToken) is not null)
        {
            throw new BusinessException("Ya existe una cuenta con ese correo electrónico.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = email,
            Email = email,
            FullName = fullName,
            PasswordHash = PasswordHasher.Hash(request.Password),
            Role = AuthRoles.User,
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return BuildLoginResponse(user);
    }

    public async Task<UserProfileResponse?> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        return user is null
            ? null
            : new UserProfileResponse(user.Id, user.FullName, user.Email, user.Role);
    }

    private LoginResponse BuildLoginResponse(User user)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(_expirationMinutes);
        var token = _tokenProvider.GenerateToken(user.Id, user.Username, user.Role, expiresAt);
        return new LoginResponse(token, "Bearer", expiresAt, user.Role, user.Id, user.FullName, user.Email);
    }

    private async Task<User> EnsureAdminUserAsync(CancellationToken cancellationToken)
    {
        var existing = await _userRepository.GetByUsernameAsync(_adminCredentials.Username, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            Username = _adminCredentials.Username,
            Email = "admin@eventosvivos.local",
            FullName = "Administrador",
            PasswordHash = PasswordHasher.Hash(_adminCredentials.Password),
            Role = AuthRoles.Admin,
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(adminUser, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return adminUser;
    }
}
