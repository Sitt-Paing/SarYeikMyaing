using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Bookshop.Interfaces;
using Bookshop.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace Bookshop.Services;

public class AccountService(
    UserManager<IdentityUser> userManager,
    SignInManager<IdentityUser> signInManager,
    RoleManager<IdentityRole> roleManager,
    IConfiguration config,
    ILogger<AccountService> logger) : IAccountService
{
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "User",
        "Admin",
        "DevAdmin"
    };

    public async Task<IdentityResult> RegisterAsync(RegisterDto dto)
    {
        logger.LogInformation("Registration Attempt for User: {UserName}", dto.UserName);
        IdentityUser? existingUser = await userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
        {
            logger.LogInformation("User Already Exists with Email: {Email}", dto.Email);
            return IdentityResult.Failed(new IdentityError { Description = "User Already Exists" });
        }

        IdentityUser user = new IdentityUser { UserName = dto.UserName, Email = dto.Email };
        IdentityResult result = await userManager.CreateAsync(user, dto.Password);

        if (!result.Succeeded)
        {
            logger.LogError("User creation failed for {Email}. Errors: {Errors}",
                dto.Email, string.Join(", ", result.Errors.Select(e => e.Description)));
            return result;
        }

        string roleName = string.IsNullOrWhiteSpace(dto.Role) ? "User" : dto.Role.Trim();
        if (!AllowedRoles.Contains(roleName))
        {
            roleName = "User";
        }

        if (!await roleManager.RoleExistsAsync(roleName))
        {
            await roleManager.CreateAsync(new IdentityRole(roleName));
        }

        logger.LogInformation("User {Email} registered successfully with Role: {Role}", dto.Email, roleName);
        await userManager.AddToRoleAsync(user, roleName);
        return IdentityResult.Success;
    }

    public async Task<(string AccessToken, string RefreshToken, DateTime Expiry)?> LoginAsync(LoginDto dto)
    {
        logger.LogInformation("Login attempt for: {Identifier}", dto.UserNameOrEmailOrPhone);

        IdentityUser? user = dto.UserNameOrEmailOrPhone.Contains("@")
            ? await userManager.FindByEmailAsync(dto.UserNameOrEmailOrPhone)
            : await userManager.FindByNameAsync(dto.UserNameOrEmailOrPhone);

        if (user == null)
        {
            logger.LogWarning("Login Failed for: {Identifier}", dto.UserNameOrEmailOrPhone);
            return null;
        }

        var result = await signInManager.PasswordSignInAsync(user, dto.Password, false, false);
        if (result.IsLockedOut)
        {
            logger.LogCritical("Account LOCKED: {Email} due to multiple failed attempts.", user.Email);
            return null;
        }

        if (result.Succeeded)
        {
            (string, string, DateTime) tokenInfo = await GenerateJwtToken(user);
            logger.LogInformation("User {Email} logged in successfully. Token generated.", user.Email);
            return tokenInfo;
        }

        logger.LogWarning("Invalid password attempt for User: {Email}", user.Email);
        return null;
    }

    public async Task<string?> GenerateResetTokenAsync(string email)
    {
        IdentityUser? user = await userManager.FindByEmailAsync(email);
        if (user == null) return null;

        return await userManager.GeneratePasswordResetTokenAsync(user);
    }

    public async Task<IdentityResult> ResetPasswordAsync(ResetPasswordDto dto)
    {
        logger.LogInformation("Resetting password for email: {Email}", dto.Email);

        IdentityUser? user = await userManager.FindByEmailAsync(dto.Email);
        if (user == null)
        {
            logger.LogWarning("User with email {Email} not found", dto.Email);
            return IdentityResult.Failed(new IdentityError { Description = "User Not Found" });
        }

        IdentityResult result = await userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
        if (!result.Succeeded)
        {
            logger.LogError("Failed to reset password for email {Email}", dto.Email);
        }
        else
        {
            logger.LogInformation("Password successfully reset for email: {Email}", dto.Email);
        }

        return result;
    }

    public async Task<IdentityResult> ChangePasswordAsync(string userId, ChangePasswordDto dto)
    {
        IdentityUser? user = await userManager.FindByIdAsync(userId);
        if (user == null) return IdentityResult.Failed(new IdentityError { Description = "User not found" });

        IdentityResult result = await userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);

        if (result.Succeeded)
        {
            logger.LogInformation("User {Email} changed their password successfully.", user.Email);
        }

        return result;
    }

    public async Task<(string AccessToken, string RefreshToken, DateTime Expiry)?> RefreshTokenAsync(TokenDto dto)
    {
        logger.LogInformation("Token refresh Attempt");
        if (string.IsNullOrEmpty(dto.RefreshToken) || string.IsNullOrEmpty(dto.AccessToken))
        {
            logger.LogWarning("Token refresh failed: Invalid token request");
            return null;
        }

        ClaimsPrincipal? principal = GetPrincipalFromExpiredToken(dto.AccessToken);
        if (principal == null)
        {
            logger.LogWarning("Invalid token refresh request: Could not extract claims");
            return null;
        }

        string? userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
        {
            logger.LogWarning("Invalid token refresh request: UserId not found");
            return null;
        }

        IdentityUser? user = await userManager.FindByIdAsync(userId);
        if (user == null)
        {
            logger.LogWarning("Invalid token refresh request: User not found");
            return null;
        }

        if (!await ValidateRefreshToken(user, dto.RefreshToken))
        {
            logger.LogWarning("Invalid token refresh request: Refresh token validation failed");
            return null;
        }

        (string, string, DateTime) tokenInfo = await GenerateJwtToken(user);
        logger.LogInformation("Token Refresh Successfully!");

        return tokenInfo;
    }

    public async Task LogoutAsync(string userId)
    {
        IdentityUser? user = await userManager.FindByIdAsync(userId);
        if (user != null)
        {
            await userManager.RemoveAuthenticationTokenAsync(user, "BookshopApp", "refreshToken");
            await userManager.RemoveAuthenticationTokenAsync(user, "BookshopApp", "refreshTokenExpiry");
            logger.LogInformation("User {Email} logged out and refresh tokens cleared.", user.Email);
        }
    }

    public async Task<bool> RevokeTokenAsync(RevokeTokenDto dto, ClaimsPrincipal principal)
    {
        IdentityUser? targetUser = null;

        if (!string.IsNullOrWhiteSpace(dto.TargetEmail))
        {
            bool isAdminOrDev = principal.IsInRole("Admin") || principal.IsInRole("DevAdmin");
            if (!isAdminOrDev)
            {
                logger.LogWarning("Unauthorized attempt to revoke token for target email {Email}", dto.TargetEmail);
                return false;
            }

            targetUser = await userManager.FindByEmailAsync(dto.TargetEmail);
            if (targetUser == null)
            {
                logger.LogWarning("Target user not found for email {Email}", dto.TargetEmail);
                return false;
            }
        }
        else
        {
            string? currentUserId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(currentUserId))
            {
                targetUser = await userManager.FindByIdAsync(currentUserId);
            }
        }

        if (targetUser == null)
        {
            logger.LogWarning("User not found for token revocation");
            return false;
        }

        await userManager.RemoveAuthenticationTokenAsync(targetUser, "BookshopApp", "refreshToken");
        await userManager.RemoveAuthenticationTokenAsync(targetUser, "BookshopApp", "refreshTokenExpiry");
        await userManager.UpdateSecurityStampAsync(targetUser);

        logger.LogInformation("Refresh token revoked for user {Email}", targetUser.Email);
        return true;
    }

    #region Helpers

    private async Task<(string, string, DateTime)> GenerateJwtToken(IdentityUser user)
    {
        IConfigurationSection jwtSettings = config.GetSection("Jwt");
        SymmetricSecurityKey key =
            new(Encoding.UTF8.GetBytes(
                jwtSettings["Key"] ?? throw new ArgumentNullException("Jwt:Key", "Jwt key is not found")));
        SigningCredentials creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        List<Claim> claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
        };

        IList<string> roles = await userManager.GetRolesAsync(user);
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        int expiresInMinutes = int.TryParse(jwtSettings["ExpiresInMinutes"], out int mins) ? mins : 60;

        JwtSecurityToken token = new(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.Now.AddMinutes(expiresInMinutes),
            signingCredentials: creds
        );

        var (refreshToken, refreshTokenExpiry) = GenerateRefreshToken();
        _ = await userManager.SetAuthenticationTokenAsync(user, "BookshopApp", "refreshToken", refreshToken);
        _ = await userManager.SetAuthenticationTokenAsync(user, "BookshopApp", "refreshTokenExpiry", refreshTokenExpiry.ToString(CultureInfo.InvariantCulture));

        return (new JwtSecurityTokenHandler().WriteToken(token), refreshToken, refreshTokenExpiry);
    }

    private (string, DateTime) GenerateRefreshToken()
    {
        byte[] randomNumber = new byte[32];
        using RandomNumberGenerator rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        string refreshToken = Convert.ToBase64String(randomNumber);
        DateTime refreshTokenExpiry = DateTime.Now.AddDays(15);
        return (refreshToken, refreshTokenExpiry);
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        try
        {
            TokenValidationParameters tokenValidationParameters = new()
            {
                ValidateAudience = false,
                ValidateIssuer = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"] ??
                    throw new ArgumentNullException("Jwt:Key", "Jwt key is not found"))),
                ValidateLifetime = false,
            };

            JwtSecurityTokenHandler tokenHandler = new();
            ClaimsPrincipal principal =
                tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);

            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256,
                    StringComparison.InvariantCultureIgnoreCase))
            {
                logger.LogWarning("Invalid JWT token");
                return null;
            }

            var expiryClaim = principal.FindFirst(JwtRegisteredClaimNames.Exp);
            if (expiryClaim != null && long.TryParse(expiryClaim.Value, out long expValue))
            {
                DateTime expiryDate = DateTimeOffset.FromUnixTimeSeconds(expValue).UtcDateTime;
                if (expiryDate > DateTime.UtcNow)
                {
                    logger.LogWarning("Token has not expired yet.");
                    return null;
                }
            }

            return principal;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error validating token");
            return null;
        }
    }

    private async Task<bool> ValidateRefreshToken(IdentityUser user, string refreshToken)
    {
        string? storedRefreshToken = await userManager.GetAuthenticationTokenAsync(user, "BookshopApp", "refreshToken");
        string? storedRefreshTokenExpiry = await userManager.GetAuthenticationTokenAsync(user, "BookshopApp", "refreshTokenExpiry");

        if (string.IsNullOrEmpty(storedRefreshToken) || string.IsNullOrEmpty(storedRefreshTokenExpiry))
        {
            logger.LogInformation("Stored refresh token or expiry is missing");
            return false;
        }

        if (!DateTime.TryParse(storedRefreshTokenExpiry, CultureInfo.InvariantCulture, out DateTime expiryDate) || expiryDate < DateTime.UtcNow)
        {
            logger.LogWarning("Refresh token is expired");
            return false;
        }

        return storedRefreshToken == refreshToken;
    }

    #endregion
}
