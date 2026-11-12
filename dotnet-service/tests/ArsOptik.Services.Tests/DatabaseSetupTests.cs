using ArsOptik.Services.Data;
using Microsoft.Extensions.DependencyInjection;

namespace ArsOptik.Services.Tests;

public sealed class DatabaseSetupTests(ServiceFactory factory) : IClassFixture<ServiceFactory>
{
    // Regression: options that differ per DbContext made EF build a new internal service provider
    // per request and throw after 20, breaking every authenticated request in production.
    [Fact]
    public void DbContexts_share_one_internal_service_provider()
    {
        for (var i = 0; i < 50; i++)
        {
            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ArsOptikDbContext>();
            Assert.NotNull(db.Model);
        }
    }
}
