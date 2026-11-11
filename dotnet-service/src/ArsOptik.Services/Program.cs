using ArsOptik.Services.Auth;
using ArsOptik.Services.Data;
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
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddArsOptikDatabase();
builder.Services.AddNestJwtAuthentication();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapOpenApi();
app.MapScalarApiReference("/docs", options => options.WithTitle("ARS Optik .NET Servisi"));

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithTags("Sistem")
    .ExcludeFromDescription();
app.MapAccountEndpoints();

app.Run();

// Exposes the entry point to WebApplicationFactory in the test project.
public partial class Program;
