using ArsOptik.Services.Configuration;
using Npgsql;

namespace ArsOptik.Services.Tests;

public sealed class DatabaseUrlTests
{
    [Fact]
    public void Converts_neon_pooler_url()
    {
        var connectionString = DatabaseUrl.ToNpgsqlConnectionString(
            "postgresql://neondb_owner:p%40ss%3Aword@ep-cold-dew-123-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require");

        var parsed = new NpgsqlConnectionStringBuilder(connectionString);
        Assert.Equal("ep-cold-dew-123-pooler.us-west-2.aws.neon.tech", parsed.Host);
        Assert.Equal(5432, parsed.Port);
        Assert.Equal("neondb", parsed.Database);
        Assert.Equal("neondb_owner", parsed.Username);
        Assert.Equal("p@ss:word", parsed.Password);
        Assert.Equal(SslMode.Require, parsed.SslMode);
        Assert.Equal(ChannelBinding.Require, parsed.ChannelBinding);
    }

    [Fact]
    public void Converts_local_prisma_url_with_port_and_schema()
    {
        var parsed = new NpgsqlConnectionStringBuilder(DatabaseUrl.ToNpgsqlConnectionString(
            "postgresql://ars_optik:ars_optik_dev@localhost:5433/ars_optik_db?schema=public"));

        Assert.Equal("localhost", parsed.Host);
        Assert.Equal(5433, parsed.Port);
        Assert.Equal("public", parsed.SearchPath);
    }

    [Theory]
    [InlineData("mysql://user:pass@localhost/db")]
    [InlineData("not a url")]
    public void Rejects_non_postgres_urls(string url) =>
        Assert.Throws<ArgumentException>(() => DatabaseUrl.ToNpgsqlConnectionString(url));
}
