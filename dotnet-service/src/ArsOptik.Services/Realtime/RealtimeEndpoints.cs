using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.SignalR;

namespace ArsOptik.Services.Realtime;

public static class RealtimeEndpoints
{
    public const string InternalKeyHeader = "X-Internal-Api-Key";
    private const int MinimumKeyBytes = 32;

    public static IServiceCollection AddRealtime(this IServiceCollection services)
    {
        services.AddSignalR();
        return services;
    }

    public static IEndpointRouteBuilder MapRealtimeEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapHub<AdminOrdersHub>(AdminOrdersHub.Path, options =>
        {
            // The connection outlives the 15-minute access token otherwise; closing it makes the
            // client reconnect with a fresh token, which re-checks that the user is still an admin.
            options.CloseOnAuthenticationExpiration = true;
        });

        app.MapPost("/internal/order-events", PublishOrderEventAsync)
            .AllowAnonymous()
            .ExcludeFromDescription();

        return app;
    }

    /// <summary>Called by the NestJS backend; authenticated with the shared INTERNAL_API_KEY.</summary>
    private static async Task<IResult> PublishOrderEventAsync(
        HttpRequest request,
        OrderEvent orderEvent,
        IConfiguration configuration,
        IHubContext<AdminOrdersHub, IAdminOrdersClient> hub,
        ILogger<AdminOrdersHub> logger)
    {
        var expectedKey = configuration["INTERNAL_API_KEY"];
        if (string.IsNullOrEmpty(expectedKey) || Encoding.UTF8.GetByteCount(expectedKey) < MinimumKeyBytes)
        {
            return TypedResults.Problem("Canlı bildirimler yapılandırılmamış (INTERNAL_API_KEY).",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        if (!KeysMatch(request.Headers[InternalKeyHeader].ToString(), expectedKey))
        {
            return TypedResults.Unauthorized();
        }

        if (!orderEvent.IsValid)
        {
            return TypedResults.Problem("Geçersiz sipariş olayı.", statusCode: StatusCodes.Status400BadRequest);
        }

        await hub.Clients.All.OrderEvent(orderEvent);
        logger.LogInformation("Order event {Type} for {OrderNumber} sent to admins", orderEvent.Type, orderEvent.OrderNumber);
        return TypedResults.Accepted((string?)null);
    }

    // Constant-time comparison so response timing does not leak how much of the key matched.
    private static bool KeysMatch(string provided, string expected) =>
        CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(provided), Encoding.UTF8.GetBytes(expected));
}
