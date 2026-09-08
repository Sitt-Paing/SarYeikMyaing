using Bookshop.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Bookshop.Data;

public class ApplicationDbContextInitializer
{
    private readonly ILogger<ApplicationDbContextInitializer> _logger;
    private readonly ApplicationDbContext _context;
    private readonly BookshopDbContext _bookshopContext;
    private readonly UserManager<IdentityUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public ApplicationDbContextInitializer(
        ILogger<ApplicationDbContextInitializer> logger,
        ApplicationDbContext context,
        BookshopDbContext bookshopContext,
        UserManager<IdentityUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        _logger = logger;
        _context = context;
        _bookshopContext = bookshopContext;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    public async Task InitialiseAsync()
    {
        // The Identity tables (AspNetUsers, AspNetRoles, etc.) already exist in the SQL database.
        // We skip MigrateAsync to avoid PendingModelChangesWarning in EF Core 9/10.
        await Task.CompletedTask;
    }

    public async Task SeedAsync()
    {
        try
        {
            await TrySeedAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding the database.");
            throw;
        }
    }

    public async Task TrySeedAsync()
    {
        // 1. Seed default roles
        var rolesToSeed = new[] { "DevAdmin", "Admin", "User", "Administrator" };
        foreach (var roleName in rolesToSeed)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                await _roleManager.CreateAsync(new IdentityRole(roleName));
                _logger.LogInformation("Role '{Role}' created.", roleName);
            }
        }

        // 2. Seed or update devadmin user (DevAdmin + Admin roles, password Devadmin@123)
        var devAdminUser = await _userManager.FindByNameAsync("devadmin")
                           ?? await _userManager.FindByEmailAsync("devadmin@gmail.com");

        if (devAdminUser == null)
        {
            devAdminUser = new IdentityUser
            {
                UserName = "devadmin",
                Email = "devadmin@gmail.com",
                EmailConfirmed = true
            };
            var createResult = await _userManager.CreateAsync(devAdminUser, "Devadmin@123");
            if (createResult.Succeeded)
            {
                await _userManager.AddToRolesAsync(devAdminUser, new[] { "DevAdmin", "Admin" });
                _logger.LogInformation("devadmin user created with Devadmin@123 and roles DevAdmin, Admin.");
            }
            else
            {
                _logger.LogError("Failed to create devadmin: {Errors}", string.Join(", ", createResult.Errors.Select(e => e.Description)));
            }
        }
        else
        {
            // Reset password to guaranteed Devadmin@123
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(devAdminUser);
            await _userManager.ResetPasswordAsync(devAdminUser, resetToken, "Devadmin@123");

            // Ensure roles
            if (!await _userManager.IsInRoleAsync(devAdminUser, "DevAdmin"))
            {
                await _userManager.AddToRoleAsync(devAdminUser, "DevAdmin");
            }
            if (!await _userManager.IsInRoleAsync(devAdminUser, "Admin"))
            {
                await _userManager.AddToRoleAsync(devAdminUser, "Admin");
            }
            _logger.LogInformation("devadmin password updated to Devadmin@123 and roles verified.");
        }

        // 3. Seed or update admin user (Admin role, password Admin@123)
        var adminUser = await _userManager.FindByNameAsync("admin")
                        ?? await _userManager.FindByEmailAsync("admin@gmail.com");

        if (adminUser == null)
        {
            adminUser = new IdentityUser
            {
                UserName = "admin",
                Email = "admin@gmail.com",
                EmailConfirmed = true
            };
            var createResult = await _userManager.CreateAsync(adminUser, "Admin@123");
            if (createResult.Succeeded)
            {
                await _userManager.AddToRolesAsync(adminUser, new[] { "Admin" });
                _logger.LogInformation("admin user created with Admin@123 and role Admin.");
            }
            else
            {
                _logger.LogError("Failed to create admin: {Errors}", string.Join(", ", createResult.Errors.Select(e => e.Description)));
            }
        }
        else
        {
            // Reset password to guaranteed Admin@123
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(adminUser);
            await _userManager.ResetPasswordAsync(adminUser, resetToken, "Admin@123");

            // Ensure roles
            if (!await _userManager.IsInRoleAsync(adminUser, "Admin"))
            {
                await _userManager.AddToRoleAsync(adminUser, "Admin");
            }
            _logger.LogInformation("admin password updated to Admin@123 and role Admin verified.");
        }
    }
}
