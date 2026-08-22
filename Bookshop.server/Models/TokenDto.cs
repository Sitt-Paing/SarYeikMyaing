namespace Bookshop.Models;

public class TokenDto
{
    public string AccessToken { get; set; } = null!;

    public string RefreshToken { get; set; } = null!;
}
