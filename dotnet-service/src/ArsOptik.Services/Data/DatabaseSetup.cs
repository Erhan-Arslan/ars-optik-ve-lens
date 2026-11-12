using ArsOptik.Services.Configuration;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Npgsql.NameTranslation;

namespace ArsOptik.Services.Data;

public static class DatabaseSetup
{
    // Must be one shared instance: EF Core compares options by value to reuse its internal service
    // provider, and a new translator per DbContext would build a new provider on every request
    // (EF throws after 20 — ManyServiceProvidersCreatedWarning).
    private static readonly UpperSnakeCaseNameTranslator EnumNameTranslator = new();

    public static IServiceCollection AddArsOptikDatabase(this IServiceCollection services)
    {
        services.AddDbContext<ArsOptikDbContext>((provider, options) =>
        {
            var databaseUrl = provider.GetRequiredService<IConfiguration>()["DATABASE_URL"]
                ?? throw new InvalidOperationException("DATABASE_URL tanımlı değil.");

            options
                .UseNpgsql(
                    DatabaseUrl.ToNpgsqlConnectionString(databaseUrl),
                    npgsql => npgsql
                        .MapEnum<UserRole>("Role", nameTranslator: EnumNameTranslator)
                        .MapEnum<OrderStatus>("OrderStatus", nameTranslator: EnumNameTranslator)
                        .MapEnum<PaymentStatus>("PaymentStatus", nameTranslator: EnumNameTranslator))
                .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
        });

        return services;
    }

    /// <summary>
    /// Prisma stores enum labels as written in the schema: <c>ADMIN</c>, <c>TESLIM_EDILDI</c>.
    /// Maps C# members accordingly (<c>Admin</c> → <c>ADMIN</c>, <c>TeslimEdildi</c> → <c>TESLIM_EDILDI</c>).
    /// </summary>
    private sealed class UpperSnakeCaseNameTranslator : INpgsqlNameTranslator
    {
        private static readonly NpgsqlSnakeCaseNameTranslator SnakeCase = new();

        public string TranslateTypeName(string clrName) => clrName;

        public string TranslateMemberName(string clrName) => SnakeCase.TranslateMemberName(clrName).ToUpperInvariant();
    }
}
