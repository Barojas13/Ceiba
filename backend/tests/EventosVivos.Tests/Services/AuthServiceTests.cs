using EventosVivos.Application.Constants;
using EventosVivos.Application.DTOs;
using EventosVivos.Application.Interfaces;
using EventosVivos.Application.Options;
using EventosVivos.Application.Security;
using EventosVivos.Application.Services;
using EventosVivos.Domain.Entities;
using EventosVivos.Domain.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;

namespace EventosVivos.Tests.Services;

public class AuthServiceTests
{
    private readonly Guid _adminUserId = Guid.NewGuid();

    [Fact]
    public async Task LoginAsync_ShouldReturnToken_WhenCredentialsAreValid()
    {
        var service = CreateService("admin", "Admin123!", "fake-jwt-token", existingAdmin: true);

        var result = await service.LoginAsync(new LoginRequest("admin", "Admin123!"));

        result.Should().NotBeNull();
        result!.Token.Should().Be("fake-jwt-token");
        result.Role.Should().Be(AuthRoles.Admin);
        result.TokenType.Should().Be("Bearer");
    }

    [Fact]
    public async Task LoginAsync_ShouldReturnNull_WhenPasswordIsInvalid()
    {
        var service = CreateService("admin", "Admin123!", "fake-jwt-token", existingAdmin: true);

        var result = await service.LoginAsync(new LoginRequest("admin", "wrong-password"));

        result.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_ShouldReturnNull_WhenUsernameIsInvalid()
    {
        var service = CreateService("admin", "Admin123!", "fake-jwt-token", existingAdmin: true);

        var result = await service.LoginAsync(new LoginRequest("hacker", "Admin123!"));

        result.Should().BeNull();
    }

    private AuthService CreateService(string username, string password, string token, bool existingAdmin)
    {
        var adminOptions = Options.Create(new AdminCredentialsOptions
        {
            Username = username,
            Password = password,
            Role = AuthRoles.Admin
        });

        var jwtOptions = Options.Create(new JwtOptions { ExpirationMinutes = 60 });

        var tokenProvider = new Mock<ITokenProvider>();
        tokenProvider
            .Setup(p => p.GenerateToken(It.IsAny<Guid>(), username, AuthRoles.Admin, It.IsAny<DateTime>()))
            .Returns(token);

        var userRepository = new Mock<IUserRepository>();
        userRepository
            .Setup(r => r.GetByUsernameAsync(username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingAdmin
                ? new User
                {
                    Id = _adminUserId,
                    Username = username,
                    Email = "admin@eventosvivos.local",
                    FullName = "Administrador",
                    PasswordHash = PasswordHasher.Hash(password),
                    Role = AuthRoles.Admin
                }
                : null);

        var unitOfWork = new Mock<IUnitOfWork>();

        return new AuthService(
            userRepository.Object,
            unitOfWork.Object,
            tokenProvider.Object,
            adminOptions,
            jwtOptions);
    }
}
