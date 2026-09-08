namespace Bookshop.Interfaces;

public interface ICookieService
{
    void SetAuthCookies(string accessToken, string refreshToken, DateTime accessTokenExpiry, DateTime refreshTokenExpiry, bool rememberMe);
    void ClearAuthCookies();
    string? GetRefreshToken();
    string? GetAccessToken();
}
