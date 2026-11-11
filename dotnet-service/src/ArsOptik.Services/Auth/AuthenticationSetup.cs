using System.Security.Claims;
using System.Text;
using ArsOptik.Services.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace ArsOptik.Services.Auth;

/// <summary>
/// Accepts the access tokens issued by the NestJS backend: HS256, signed with the shared
/// <c>JWT_ACCESS_SECRET</c>, carrying only <c>sub</c> and <c>email</c>.
/// </summary>
public static class AuthenticationSetup
{
    public const string AdminPolicy = "admin";

    // HS256 keys shorter than 256 bits are rejected by Microsoft.IdentityModel.
    private const int MinimumSecretBytes = 32;

    public static IServiceCollection AddNestJwtAuthentication(this IServiceCollection services)
    {
        services.AddScoped<IUserDirectory, EfUserDirectory>();

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer();

        // Configured through options (not eagerly in Program.cs) so test hosts can supply the secret.
        services
            .AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IConfiguration>((options, configuration) =>
            {
                var secret = configuration["JWT_ACCESS_SECRET"]
                    ?? throw new InvalidOperationException("JWT_ACCESS_SECRET tanımlı değil.");
                var key = Encoding.UTF8.GetBytes(secret);
                if (key.Length < MinimumSecretBytes)
                {
                    throw new InvalidOperationException($"JWT_ACCESS_SECRET en az {MinimumSecretBytes} bayt olmalı.");
                }

                options.MapInboundClaims = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    // NestJS signs without issuer/audience.
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
                    ClockSkew = TimeSpan.FromSeconds(30),
                    NameClaimType = AppClaims.Email,
                    RoleClaimType = AppClaims.Role,
                };
                options.Events = new JwtBearerEvents { OnTokenValidated = AttachUserAsync };
            })
            .ValidateOnStart();

        services
            .AddAuthorizationBuilder()
            .AddPolicy(AdminPolicy, policy => policy.RequireRole(AppClaims.AdminRole));

        return services;
    }

    // Same as the NestJS JwtStrategy: the role is not in the token, so it is read from the users
    // table on every request; deleted users and demoted admins lose access immediately.
    private static async Task AttachUserAsync(TokenValidatedContext context)
    {
        var identity = context.Principal?.Identity as ClaimsIdentity;
        var userId = identity?.FindFirst(AppClaims.Subject)?.Value;
        if (identity is null || userId is null)
        {
            context.Fail("Token'da kullanıcı kimliği yok.");
            return;
        }

        var directory = context.HttpContext.RequestServices.GetRequiredService<IUserDirectory>();
        var user = await directory.FindAsync(userId, context.HttpContext.RequestAborted);
        if (user is null)
        {
            context.Fail("Kullanıcı bulunamadı.");
            return;
        }

        identity.AddClaim(new Claim(AppClaims.Role, user.Role == UserRole.Admin ? AppClaims.AdminRole : AppClaims.UserRole));
        identity.AddClaim(new Claim(AppClaims.FirstName, user.FirstName));
        identity.AddClaim(new Claim(AppClaims.LastName, user.LastName));
    }
}

public static class AppClaims
{
    public const string Subject = "sub";
    public const string Email = "email";
    public const string Role = "role";
    public const string FirstName = "given_name";
    public const string LastName = "family_name";

    public const string UserRole = "user";
    public const string AdminRole = "admin";
}
