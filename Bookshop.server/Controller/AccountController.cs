using System.Security.Claims;
using Bookshop.Interfaces;
using Bookshop.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Bookshop.Controller;

[Route("api/[controller]")]
[ApiController]
public class AccountController(IAccountService accountService) : ControllerBase
{
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

    [HttpPost("Login")]
    [AllowAnonymous]
    [EndpointSummary("User Login")]
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

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Login successful",
            Data = new
            {
                AccessToken = result.Value.AccessToken,
                RefreshToken = result.Value.RefreshToken,
                RefreshTokenExpiry = result.Value.Expiry
            }
        });
    }

    [HttpPost("reset-password")]
    [EndpointSummary("Reset Password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
    {
        IdentityResult result = await accountService.ResetPasswordAsync(dto);
        if (!result.Succeeded)
        {
            if (result.Errors.Any(e => e.Description == "User Not Found"))
            {
                return BadRequest(new DefaultResponseModel
                {
                    Success = false,
                    Statuscode = 400,
                    Message = "User Not Found",
                    Data = null
                });
            }
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Failed to reset password",
                Data = result.Errors
            });
        }

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Password reset successfully!",
            Data = null
        });
    }

    [HttpPost("ChangePassword")]
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
                Message = "Unauthorized",
                Data = null
            });
        }

        IdentityResult result = await accountService.ChangePasswordAsync(userId, dto);

        if (!result.Succeeded)
        {
            if (result.Errors.Any(e => e.Description == "User not found"))
            {
                return BadRequest(new DefaultResponseModel
                {
                    Success = false,
                    Statuscode = 400,
                    Message = "User not found",
                    Data = null
                });
            }
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Password change failed",
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

    [HttpPost("RefreshToken")]
    [AllowAnonymous]
    [EndpointSummary("Refresh JWT Token")]
    public async Task<IActionResult> Refresh(TokenDto dto)
    {
        var result = await accountService.RefreshTokenAsync(dto);
        if (result == null)
        {
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Invalid client request",
                Data = null
            });
        }

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Token refreshed successfully",
            Data = new
            {
                AccessToken = result.Value.AccessToken,
                RefreshToken = result.Value.RefreshToken,
                RefreshTokenExpiry = result.Value.Expiry
            }
        });
    }

    [HttpPost("Logout")]
    [Authorize]
    [EndpointSummary("User Logout")]
    public async Task<IActionResult> Logout()
    {
        string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
        {
            return Unauthorized(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 401,
                Message = "Unauthorized",
                Data = null
            });
        }

        await accountService.LogoutAsync(userId);

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Logged out successfully!",
            Data = null
        });
    }

    [HttpPost("revoke-token")]
    [Authorize]
    [EndpointSummary("Revoke Refresh Token (Self or Admin Target)")]
    public async Task<IActionResult> RevokeToken([FromBody] RevokeTokenDto dto)
    {
        bool result = await accountService.RevokeTokenAsync(dto, User);
        if (!result)
        {
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Invalid token or revocation failed",
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
