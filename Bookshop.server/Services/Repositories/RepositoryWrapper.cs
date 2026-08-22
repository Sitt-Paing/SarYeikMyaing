using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using Bookshop.Data;
using Bookshop.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.IdentityModel.Tokens;

namespace Bookshop.Services.Repositories;

public class RepositoryWrapper(
    BookshopDbContext context,
    ILogger<RepositoryWrapper> logger,
    IHttpContextAccessor accessor,
    IConfiguration configuration
) : IRepositoryWrapper
{
    private readonly ILogger<RepositoryWrapper> _logger = logger ?? throw new Exception("Logger is null");
    private readonly IHttpContextAccessor _accessor = accessor ?? throw new Exception("Http Context is null");
    private readonly IConfiguration _configuration = configuration ?? throw new Exception("Configuration is null");

    public IAuthorRepo Authors
    {
        get
        {
            field ??= new AuthorRepo(context);
            return field;
        }
    }

    public IBookRepo Books
    {
        get
        {
            field ??= new BookRepo(context);
            return field;
        }
    }

    public ICartRepo Carts
    {
        get
        {
            field ??= new CartRepo(context);
            return field;
        }
    }

    public ICartItemRepo CartItems
    {
        get
        {
            field ??= new CartItemRepo(context);
            return field;
        }
    }

    public ICategoryRepo Categories
    {
        get
        {
            field ??= new CategoryRepo(context);
            return field;
        }
    }

    public IOrderRepo Orders
    {
        get
        {
            field ??= new OrderRepo(context);
            return field;
        }
    }

    public IOrderItemRepo OrderItems
    {
        get
        {
            field ??= new OrderItemRepo(context);
            return field;
        }
    }

    public IPaymentRepo Payments
    {
        get
        {
            field ??= new PaymentRepo(context);
            return field;
        }
    }

    #region General Methods

    public BookshopDbContext Context { get; } = context ?? throw new Exception();
    // Db Action without Async
    public void Save()
    {
        LogChangesStates(Context.ChangeTracker);
        _ = Context.SaveChanges();
    }

    // Db Action with Async
    public async Task<bool> SaveAsync()
    {
        /*Context.ChangeTracker.AutoDetectChangesEnabled = true;
        Context.ChangeTracker.DetectChanges();
        // Before (Only Modified and Deleted State)
        LogChangesStates(Context.ChangeTracker);*/
        int res = await Context.SaveChangesAsync();
        return res > 0;
    }

    private void LogChangesStates(ChangeTracker tracker)
        {
            string? authHeader = _accessor.HttpContext?.Request.Headers.Authorization.ToString();

            if (!AuthenticationHeaderValue.TryParse(authHeader, out var headerValue))
            {
                return;
            }

            string? token = headerValue.Parameter;

            if (string.IsNullOrWhiteSpace(token) || token == "null" || token == "undefined")
            {
                return;
            }

            string? accesstoken = _accessor.HttpContext?.Request.Headers.Authorization[0]?.Split(' ')[1];
            string? userId = GetPrincipalFromExpiredToken(accesstoken ?? string.Empty).Identity?.Name;
            string[] ExcludedTrackingTables = { "NotificationToken", "TokenClaim", "ActivityChange", "HrPermission" };
            List<EntityEntry> entries = [.. tracker.Entries()];

            lock (entries)
            {
                foreach (EntityEntry entry in entries)
                {
                    if (ExcludedTrackingTables.Contains(entry.Entity.GetType().Name)) continue;

                    _logger.LogInformation("Entity: {entName}, State: {entState}", entry.Entity.GetType().Name, entry.State);

                    if (entry.State is EntityState.Modified)
                    {
                        StringBuilder stringBuilder = new(entry.DebugView.ShortView + "\n\n");
                        foreach (Microsoft.EntityFrameworkCore.Metadata.IProperty prop in entry.OriginalValues.Properties)
                        {
                            string? originalValue = entry.OriginalValues[prop]?.ToString();
                            string? currentValue = entry.CurrentValues[prop]?.ToString();
                            if (originalValue != currentValue) //Only create a log if the value changes
                            {
                                _ = stringBuilder.Append($"{prop.Name}: {currentValue} Originally {originalValue}\n");
                                _logger.LogInformation("{propName}:  {ModifiedValue} Originally {OriginValue}", prop.Name, originalValue, currentValue);
                            }
                        }
                    }
                }
            }
        }

        private ClaimsPrincipal GetPrincipalFromExpiredToken(string access_token)
        {

            TokenValidationParameters tokenValidationParameters = new()
            {
                ValidateAudience = false,
                ValidateIssuer = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Secret"] ?? "")),
                ValidateLifetime = false,
            };

            JwtSecurityTokenHandler tokenHandler = new();
            ClaimsPrincipal principal = tokenHandler.ValidateToken(access_token, tokenValidationParameters, out SecurityToken securityToken);
            return securityToken is not JwtSecurityToken jwtSecurityToken || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase)
                ? throw new SecurityTokenException("Invalid token")
                : principal;
        }

        public IDbContextTransaction TransactionBegin() => Context.Database.BeginTransaction();

        public async Task<IDbContextTransaction> TransactionBeginAsync() => await Context.Database.BeginTransactionAsync();
    #endregion
}