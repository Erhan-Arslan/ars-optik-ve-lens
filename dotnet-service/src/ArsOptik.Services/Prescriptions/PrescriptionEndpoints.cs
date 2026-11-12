namespace ArsOptik.Services.Prescriptions;

public static class PrescriptionEndpoints
{
    public const string RateLimitPolicy = "prescription-analysis";

    public static IServiceCollection AddPrescriptionAnalysis(this IServiceCollection services)
    {
        services.AddMemoryCache();
        services.AddScoped<ILensIndexCatalog, EfLensIndexCatalog>();
        services.AddScoped<PrescriptionAnalyzer>();
        return services;
    }

    public static IEndpointRouteBuilder MapPrescriptionEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/prescriptions/analyze", AnalyseAsync)
            .AllowAnonymous()
            .RequireRateLimiting(RateLimitPolicy)
            .WithTags("Reçete")
            .WithSummary("Reçeteyi doğrular, cam inceliklerine göre kalınlık tahmini yapar ve öneride bulunur.")
            .ProducesValidationProblem();

        return app;
    }

    private static async Task<IResult> AnalyseAsync(
        PrescriptionAnalysisRequest request, PrescriptionAnalyzer analyzer, CancellationToken cancellationToken)
    {
        var errors = PrescriptionValidator.Validate(request);
        if (errors.Count > 0)
        {
            return TypedResults.ValidationProblem(errors, title: "Reçete değerleri geçersiz.");
        }

        return TypedResults.Ok(await analyzer.AnalyseAsync(request, cancellationToken));
    }
}
