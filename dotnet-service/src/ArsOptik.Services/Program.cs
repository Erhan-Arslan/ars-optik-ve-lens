using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using ArsOptik.Services.Auth;
using ArsOptik.Services.Data;
using ArsOptik.Services.Prescriptions;
using Microsoft.AspNetCore.HttpOverrides;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Render and docker-compose pass the port via PORT, same as the NestJS backend.
if (Environment.GetEnvironmentVariable("PORT") is { Length: > 0 } port)
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

var corsOrigins = (builder.Configuration["CORS_ORIGIN"] ?? "http://localhost:3000")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(cors => cors.AddDefaultPolicy(policy => policy
    .WithOrigins(corsOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));

// Render terminates TLS at its proxy; trust its X-Forwarded-For so rate limits see client IPs.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddRateLimiter(limiter =>
{
    limiter.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    // The form re-analyses as the user edits (debounced), so allow a generous burst per IP.
    limiter.AddPolicy(PrescriptionEndpoints.RateLimitPolicy, context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 60, Window = TimeSpan.FromMinutes(1) }));
});

builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)));
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddArsOptikDatabase();
builder.Services.AddNestJwtAuthentication();
builder.Services.AddPrescriptionAnalysis();

var app = builder.Build();

app.UseForwardedHeaders();
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapOpenApi();
app.MapScalarApiReference("/docs", options => options.WithTitle("ARS Optik .NET Servisi"));

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithTags("Sistem")
    .ExcludeFromDescription();
app.MapAccountEndpoints();
app.MapPrescriptionEndpoints();

app.Run();

// Exposes the entry point to WebApplicationFactory in the test project.
public partial class Program;
