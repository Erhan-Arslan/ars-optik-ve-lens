using System.Security.Claims;
using System.Threading.RateLimiting;
using ArsOptik.Services.Auth;

namespace ArsOptik.Services.Invoices;

public static class InvoiceEndpoints
{
    public const string RateLimitPolicy = "invoice-download";

    public static IServiceCollection AddInvoices(this IServiceCollection services)
    {
        services.AddScoped<IInvoiceDataSource, EfInvoiceDataSource>();
        services.AddSingleton(TimeProvider.System);
        services.AddRateLimiter(limiter =>
            // PDF rendering is CPU work on a small free instance; cap it per user.
            limiter.AddPolicy(RateLimitPolicy, context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    context.User.FindFirstValue(AppClaims.Subject) ?? "anonymous",
                    _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1) })));
        return services;
    }

    public static IEndpointRouteBuilder MapInvoiceEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/orders/{orderNumber}/invoice", DownloadAsync)
            .RequireAuthorization()
            .RequireRateLimiting(RateLimitPolicy)
            .WithTags("Fatura")
            .WithSummary("Siparişin proforma faturasını PDF olarak döndürür (sipariş sahibi veya admin).")
            .Produces(StatusCodes.Status200OK, contentType: "application/pdf")
            .ProducesProblem(StatusCodes.Status404NotFound);

        return app;
    }

    private static async Task<IResult> DownloadAsync(
        string orderNumber,
        ClaimsPrincipal user,
        IInvoiceDataSource dataSource,
        TimeProvider clock,
        HttpResponse response,
        CancellationToken cancellationToken)
    {
        var source = await dataSource.FindAsync(orderNumber, cancellationToken);

        // Someone else's order answers exactly like a missing one, so order numbers cannot be probed.
        var allowed = source is not null
            && (source.OwnerUserId == user.FindFirstValue(AppClaims.Subject) || user.IsInRole(AppClaims.AdminRole));
        if (!allowed)
        {
            return TypedResults.Problem("Sipariş bulunamadı.", statusCode: StatusCodes.Status404NotFound);
        }

        var pdf = InvoiceDocument.GeneratePdf(source!.Data, clock.GetUtcNow());
        response.Headers.CacheControl = "no-store";
        return TypedResults.File(pdf, "application/pdf", $"ARS-Optik-{orderNumber}.pdf");
    }
}
