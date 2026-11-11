using System.Net;
using System.Net.Http.Json;
using ArsOptik.Services.Auth;

namespace ArsOptik.Services.Tests;

public sealed class AuthenticationTests(ServiceFactory factory) : IClassFixture<ServiceFactory>
{
    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Health_is_public()
    {
        var response = await factory.CreateClient().GetAsync("/health", Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Me_requires_a_token()
    {
        var response = await factory.CreateClient().GetAsync("/me", Ct);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_returns_customer_with_role_from_database()
    {
        var customer = ServiceFactory.Customer;
        var client = factory.CreateClientWithToken(ServiceFactory.CreateToken(customer.Id, customer.Email));

        var me = await client.GetFromJsonAsync<CurrentUserResponse>("/me", Ct);

        Assert.Equal(new CurrentUserResponse(customer.Id, customer.Email, "Ayşe", "Yılmaz", "user"), me);
    }

    [Fact]
    public async Task Me_maps_admin_role()
    {
        var admin = ServiceFactory.Admin;
        var client = factory.CreateClientWithToken(ServiceFactory.CreateToken(admin.Id, admin.Email));

        var me = await client.GetFromJsonAsync<CurrentUserResponse>("/me", Ct);

        Assert.Equal("admin", me?.Role);
    }

    [Fact]
    public async Task Rejects_token_signed_with_another_secret()
    {
        var token = ServiceFactory.CreateToken(ServiceFactory.Customer.Id, ServiceFactory.Customer.Email,
            secret: "some-other-secret-that-is-also-32-bytes-long");

        var response = await factory.CreateClientWithToken(token).GetAsync("/me", Ct);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Rejects_expired_token()
    {
        var token = ServiceFactory.CreateToken(ServiceFactory.Customer.Id, ServiceFactory.Customer.Email,
            expiresIn: TimeSpan.FromMinutes(-5));

        var response = await factory.CreateClientWithToken(token).GetAsync("/me", Ct);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Rejects_token_for_deleted_user()
    {
        var token = ServiceFactory.CreateToken("deleted-user", "silindi@arsoptik.com");

        var response = await factory.CreateClientWithToken(token).GetAsync("/me", Ct);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
