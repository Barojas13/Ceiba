namespace EventosVivos.Application.Options;

public class AdminCredentialsOptions
{
    public const string SectionName = "Admin";

    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "Admin";
}
