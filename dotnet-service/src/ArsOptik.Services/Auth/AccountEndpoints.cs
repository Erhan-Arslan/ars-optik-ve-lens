using System.Security.Claims;

namespace ArsOptik.Services.Auth;

public sealed record CurrentUserResponse(string Id, string Email, string FirstName, string LastName, string Role);

public static class AccountEndpoints
{
    public static IEndpointRouteBuilder MapAccountEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/me", GetCurrentUser)
            .RequireAuthorization()
            .WithTags("Hesap")
            .WithSummary("Token sahibini döndürür (NestJS oturumunun bu serviste tanındığını doğrular).");

        return app;
    }

    private static CurrentUserResponse GetCurrentUser(ClaimsPrincipal user) =>
        new(
            Id: user.FindFirstValue(AppClaims.Subject)!,
            Email: user.FindFirstValue(AppClaims.Email)!,
            FirstName: user.FindFirstValue(AppClaims.FirstName)!,
            LastName: user.FindFirstValue(AppClaims.LastName)!,
            Role: user.FindFirstValue(AppClaims.Role)!);
}
