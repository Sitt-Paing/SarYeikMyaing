namespace Bookshop.Models;

public class RevokeTokenDto
{
    public string? RefreshToken { get; set; }

    public string? TargetEmail { get; set; }
}
