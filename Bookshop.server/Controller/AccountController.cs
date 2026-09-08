using System.Security.Claims;
using Bookshop.Interfaces;
using Bookshop.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;

namespace Bookshop.Controller;

[Route("api/[controller]")]
[ApiController]
public class AccountController(IAccountService accountService, ICookieService cookieService, IAntiforgery antiforgery) : ControllerBase
{
    // ──────────────────────────────────────────────────────────────────────────────
    // CSRF TOKEN — Readable by Angular, attached as X-XSRF-TOKEN header on mutations
    // ──────────────────────────────────────────────────────────────────────────────
    [HttpGet("csrf-token")]
    [AllowAnonymous]
    [EndpointSummary("Get CSRF token for client (sets XSRF-TOKEN cookie)")]
    public IActionResult GetCsrfToken()
    {
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
        bool isHttps = Request.IsHttps;
        Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken!, new CookieOptions
        {
            HttpOnly = false,   // readable by Angular
            Secure = isHttps,
            SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
            Path = "/"
        });

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "CSRF token issued",
            Data = null
        });
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // ME — Returns the authenticated user's profile from JWT claims in HttpOnly cookie
    // ──────────────────────────────────────────────────────────────────────────────
    [HttpGet("me")]
    [Authorize]
    [EndpointSummary("Get authenticated user profile")]
    public IActionResult Me()
    {
        string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        string? email = User.FindFirstValue(ClaimTypes.Email)
                        ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email);
        string? userName = User.Identity?.Name
                           ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
        var roles = User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToList();

        if (userId == null)
        {
            return Unauthorized(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 401,
                Message = "Not authenticated",
                Data = null
            });
        }

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "User profile",
            Data = new { UserId = userId, UserName = userName, Email = email, Roles = roles }
        });
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // REGISTER
    // ──────────────────────────────────────────────────────────────────────────────
    [HttpPost("Register")]
    [AllowAnonymous]
    [EndpointSummary("Register User (Roles: User, Admin, DevAdmin)")]
    public async Task<IActionResult> RegisterAsync(RegisterDto dto)
    {
        IdentityResult result = await accountService.RegisterAsync(dto);

        if (result.Succeeded)
        {
            return Ok(new DefaultResponseModel
            {
                Success = true,
                Statuscode = 200,
                Message = "Successfully Registered",
                Data = null
            });
        }

        if (result.Errors.Any(e => e.Description == "User Already Exists"))
        {
            return Conflict(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 409,
                Message = "User Already Exists",
                Data = null
            });
        }

        return BadRequest(new DefaultResponseModel
        {
            Success = false,
            Statuscode = 400,
            Message = "Registration failed",
            Data = result.Errors
        });
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // LOGIN — Sets HttpOnly cookies instead of returning tokens in body
    // ──────────────────────────────────────────────────────────────────────────────
    [HttpPost("Login")]
    [AllowAnonymous]
    [EndpointSummary("User Login — sets HttpOnly cookie tokens, returns profile")]
    public async Task<IActionResult> LoginAsync(LoginDto dto)
    {
        var result = await accountService.LoginAsync(dto);
        if (result == null)
        {
            return Unauthorized(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 401,
                Message = "Login Failed",
                Data = null
            });
        }

        // Calculate refresh token expiry (used for persistent cookie)
        DateTime refreshExpiry = result.Value.Expiry > DateTime.Now ? result.Value.Expiry : DateTime.Now.AddDays(15);
        DateTime accessExpiry = DateTime.Now.AddMinutes(60);

        // Set HttpOnly cookies
        cookieService.SetAuthCookies(
            accessToken: result.Value.AccessToken,
            refreshToken: result.Value.RefreshToken,
            accessTokenExpiry: accessExpiry,
            refreshTokenExpiry: refreshExpiry,
            rememberMe: dto.RememberMe
        );

        // Issue fresh XSRF-TOKEN cookie readable by Angular
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
        bool isHttps = Request.IsHttps;
        Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken!, new CookieOptions
        {
            HttpOnly = false,
            Secure = isHttps,
            SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
            Path = "/"
        });

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Login successful",
            Data = new
            {
                UserId = result.Value.UserId,
                UserName = result.Value.UserName,
                Email = result.Value.Email,
                Roles = result.Value.Roles
            }
        });
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // REFRESH — Reads refresh token from HttpOnly cookie, rotates both cookies
    // ──────────────────────────────────────────────────────────────────────────────
    [HttpPost("refresh")]
    [AllowAnonymous]
    [EndpointSummary("Refresh tokens using HttpOnly cookies")]
    public async Task<IActionResult> RefreshAsync()
    {
        string? accessToken = cookieService.GetAccessToken();
        string? refreshToken = cookieService.GetRefreshToken();

        if (string.IsNullOrEmpty(accessToken) || string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 401,
                Message = "No valid refresh token found",
                Data = null
            });
        }

        var dto = new TokenDto { AccessToken = accessToken, RefreshToken = refreshToken };
        var result = await accountService.RefreshTokenAsync(dto);
        if (result == null)
        {
            cookieService.ClearAuthCookies();
            return Unauthorized(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 401,
                Message = "Token refresh failed",
                Data = null
            });
        }

        DateTime refreshExpiry = result.Value.Expiry > DateTime.Now ? result.Value.Expiry : DateTime.Now.AddDays(15);
        cookieService.SetAuthCookies(
            accessToken: result.Value.AccessToken,
            refreshToken: result.Value.RefreshToken,
            accessTokenExpiry: DateTime.Now.AddMinutes(60),
            refreshTokenExpiry: refreshExpiry,
            rememberMe: true
        );

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Token refreshed",
            Data = null
        });
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // LOGOUT — Clears cookies server side
    // ──────────────────────────────────────────────────────────────────────────────
    [HttpPost("Logout")]
    [Authorize]
    [EndpointSummary("Logout — clears HttpOnly cookies")]
    public async Task<IActionResult> LogoutAsync()
    {
        string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId != null)
        {
            await accountService.LogoutAsync(userId);
        }
        cookieService.ClearAuthCookies();

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Logged out successfully",
            Data = null
        });
    }

    // ──────────────────────────────────────────────────────────────────────────────
    // PASSWORD RESET / CHANGE
    // ──────────────────────────────────────────────────────────────────────────────
    [HttpGet("generate-reset-token")]
    [EndpointSummary("Generate Password Reset Token")]
    public async Task<IActionResult> GenerateResetToken(string email)
    {
        string? token = await accountService.GenerateResetTokenAsync(email);
        if (token == null)
        {
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "User not found",
                Data = null
            });
        }

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Reset token generated successfully",
            Data = new { Token = token }
        });
    }

    [HttpPost("reset-password")]
    [EndpointSummary("Reset Password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
    {
        IdentityResult result = await accountService.ResetPasswordAsync(dto);
        if (!result.Succeeded)
        {
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = result.Errors.FirstOrDefault()?.Description ?? "Password reset failed",
                Data = result.Errors
            });
        }

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Password reset successfully",
            Data = null
        });
    }

    [HttpPost("change-password")]
    [Authorize]
    [EndpointSummary("Change Password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            return Unauthorized(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 401,
                Message = "Not authenticated",
                Data = null
            });
        }

        IdentityResult result = await accountService.ChangePasswordAsync(userId, dto);
        if (!result.Succeeded)
        {
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = result.Errors.FirstOrDefault()?.Description ?? "Password change failed",
                Data = result.Errors
            });
        }

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Password changed successfully",
            Data = null
        });
    }

    [HttpPost("revoke-token")]
    [Authorize]
    [EndpointSummary("Revoke Refresh Token")]
    public async Task<IActionResult> RevokeToken(RevokeTokenDto dto)
    {
        bool success = await accountService.RevokeTokenAsync(dto, User);
        if (!success)
        {
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Token revocation failed",
                Data = null
            });
        }

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Token revoked successfully",
            Data = null
        });
    }
}
