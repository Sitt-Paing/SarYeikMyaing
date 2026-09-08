using System.Text;
using Bookshop.Data;
using Bookshop.Interfaces;
using Bookshop.Interfaces.Repositories;
using Bookshop.Middlewares;
using Bookshop.Services;
using Bookshop.Services.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// ─────────────────────────────────────────────────────────────────────────────────
// 1. Database Contexts — Dual Context Pattern (like InventoryManagementSystem ref)
// ─────────────────────────────────────────────────────────────────────────────────

// ApplicationDbContext: Only for ASP.NET Core Identity infrastructure
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// BookshopDbContext: Business entities + scaffolded AspNet* read-only DbSets
builder.Services.AddDbContext<BookshopDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// ─────────────────────────────────────────────────────────────────────────────────
// 2. ASP.NET Core Identity — Must use ApplicationDbContext
// ─────────────────────────────────────────────────────────────────────────────────
builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
    {
        options.Password.RequireDigit = true;
        options.Password.RequiredLength = 6;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = false;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()   // <-- MUST be ApplicationDbContext
    .AddDefaultTokenProviders();

// ─────────────────────────────────────────────────────────────────────────────────
// 3. JWT Bearer Auth — reads access_token from HttpOnly cookie
// ─────────────────────────────────────────────────────────────────────────────────
IConfigurationSection jwtSettings = builder.Configuration.GetSection("Jwt");
byte[] key = Encoding.UTF8.GetBytes(jwtSettings["Key"] ?? throw new ArgumentNullException("Jwt:Key", "JWT Key is not configured."));

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSettings["Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2)
        };
        // Read JWT from HttpOnly cookie instead of Authorization header
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (context.Request.Cookies.TryGetValue("access_token", out var accessToken))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            },
            OnChallenge = async context =>
            {
                if (!context.Response.HasStarted)
                {
                    context.HandleResponse();
                    context.Response.StatusCode = 401;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync("{\"success\": false, \"statuscode\": 401, \"message\": \"The token has expired or is unauthorized.\", \"data\": null}");
                }
            }
        };
    });

// ─────────────────────────────────────────────────────────────────────────────────
// 4. Antiforgery (XSRF-TOKEN) — Angular reads XSRF-TOKEN cookie and sends X-XSRF-TOKEN header
// ─────────────────────────────────────────────────────────────────────────────────
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-XSRF-TOKEN";   // header name Angular sends
    options.Cookie.Name = "XSRF-TOKEN";    // client-readable cookie name
    options.Cookie.HttpOnly = false;       // must be readable by JS/Angular
});

// ─────────────────────────────────────────────────────────────────────────────────
// 5. Application Services
// ─────────────────────────────────────────────────────────────────────────────────
builder.Services.AddScoped<IRepositoryWrapper, RepositoryWrapper>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<ICookieService, CookieService>();
builder.Services.AddScoped<ApplicationDbContextInitializer>();

// ─────────────────────────────────────────────────────────────────────────────────
// 6. ASP.NET Framework Services
// ─────────────────────────────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
    options.AddPolicy("AllowClient", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddOpenApi();
builder.Services.AddHttpContextAccessor();

// ─────────────────────────────────────────────────────────────────────────────────
// 7. Build the app
// ─────────────────────────────────────────────────────────────────────────────────
WebApplication app = builder.Build();

// Seed database on startup
using (var scope = app.Services.CreateScope())
{
    var initialiser = scope.ServiceProvider.GetRequiredService<ApplicationDbContextInitializer>();
    try
    {
        await initialiser.InitialiseAsync();
        await initialiser.SeedAsync();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during database seeding. App will continue without seeding.");
    }
}

app.UseExceptionHandler();
app.UseCors("AllowAll");
app.UseEncryptionMiddleware();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference("/docs/scalar");
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();