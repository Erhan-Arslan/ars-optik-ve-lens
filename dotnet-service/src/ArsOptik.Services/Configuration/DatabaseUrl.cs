using Microsoft.AspNetCore.WebUtilities;
using Npgsql;

namespace ArsOptik.Services.Configuration;

/// <summary>
/// Converts the <c>postgresql://</c> URL shared with the NestJS backend (<c>DATABASE_URL</c>)
/// into an Npgsql connection string, so both services read the same setting.
/// </summary>
public static class DatabaseUrl
{
    private const int DefaultPort = 5432;

    public static string ToNpgsqlConnectionString(string databaseUrl)
    {
        if (!Uri.TryCreate(databaseUrl, UriKind.Absolute, out var uri)
            || uri.Scheme is not ("postgres" or "postgresql"))
        {
            throw new ArgumentException("DATABASE_URL 'postgresql://' ile başlayan geçerli bir adres olmalı.", nameof(databaseUrl));
        }

        var userInfo = uri.UserInfo.Split(':', 2);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : DefaultPort,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : null,
        };

        foreach (var (key, value) in QueryHelpers.ParseQuery(uri.Query))
        {
            var text = value.ToString();
            switch (key.ToLowerInvariant())
            {
                case "sslmode":
                    builder.SslMode = Enum.Parse<SslMode>(text.Replace("-", ""), ignoreCase: true);
                    break;
                case "channel_binding":
                    builder.ChannelBinding = Enum.Parse<ChannelBinding>(text, ignoreCase: true);
                    break;
                // Prisma's ?schema= maps to the Postgres search path.
                case "schema":
                    builder.SearchPath = text;
                    break;
            }
        }

        return builder.ConnectionString;
    }
}
