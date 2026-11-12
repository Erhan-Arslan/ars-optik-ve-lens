using System.Net;
using System.Net.Http.Json;
using ArsOptik.Services.Realtime;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR.Client;

namespace ArsOptik.Services.Tests;

public sealed class RealtimeTests(ServiceFactory factory) : IClassFixture<ServiceFactory>
{
    private static readonly OrderEvent SampleEvent = new(
        OrderEvent.Created, "order-1", "ARS123456", "hazirlaniyor", 5800m, 1, "Ayşe Yılmaz", DateTimeOffset.UtcNow);

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    private HubConnection CreateHubConnection(string? token) =>
        new HubConnectionBuilder()
            .WithUrl(new Uri(factory.Server.BaseAddress, AdminOrdersHub.Path), options =>
            {
                // TestServer has no real sockets; long polling exercises the same auth and hub code.
                options.Transports = HttpTransportType.LongPolling;
                options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();
                options.AccessTokenProvider = () => Task.FromResult(token);
            })
            .Build();

    private Task<HttpResponseMessage> PostEventAsync(object body, string? key = ServiceFactory.InternalApiKey)
    {
        var client = factory.CreateClient();
        if (key is not null)
        {
            client.DefaultRequestHeaders.Add(RealtimeEndpoints.InternalKeyHeader, key);
        }
        return client.PostAsJsonAsync("/internal/order-events", body, Ct);
    }

    [Fact]
    public async Task Admin_receives_order_events_published_by_the_backend()
    {
        var admin = ServiceFactory.Admin;
        await using var connection = CreateHubConnection(ServiceFactory.CreateToken(admin.Id, admin.Email));
        var received = new TaskCompletionSource<OrderEvent>(TaskCreationOptions.RunContinuationsAsynchronously);
        connection.On<OrderEvent>(nameof(IAdminOrdersClient.OrderEvent), e => received.TrySetResult(e));
        await connection.StartAsync(Ct);

        var response = await PostEventAsync(SampleEvent);

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        var orderEvent = await received.Task.WaitAsync(TimeSpan.FromSeconds(10), Ct);
        Assert.Equal(SampleEvent with { OccurredAt = orderEvent.OccurredAt }, orderEvent);
    }

    [Fact]
    public async Task Customers_cannot_join_the_admin_hub()
    {
        var customer = ServiceFactory.Customer;
        await using var connection = CreateHubConnection(ServiceFactory.CreateToken(customer.Id, customer.Email));

        var error = await Assert.ThrowsAsync<HttpRequestException>(() => connection.StartAsync(Ct));
        Assert.Equal(HttpStatusCode.Forbidden, error.StatusCode);
    }

    [Fact]
    public async Task Anonymous_clients_cannot_join_the_admin_hub()
    {
        await using var connection = CreateHubConnection(token: null);

        var error = await Assert.ThrowsAsync<HttpRequestException>(() => connection.StartAsync(Ct));
        Assert.Equal(HttpStatusCode.Unauthorized, error.StatusCode);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("wrong-key-that-is-also-at-least-32-bytes")]
    public async Task Internal_endpoint_requires_the_shared_key(string? key)
    {
        var response = await PostEventAsync(SampleEvent, key);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Internal_endpoint_rejects_malformed_events()
    {
        var response = await PostEventAsync(SampleEvent with { Type = "order.deleted" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Internal_endpoint_is_disabled_without_a_configured_key()
    {
        var client = factory.WithWebHostBuilder(b => b.UseSetting("INTERNAL_API_KEY", "")).CreateClient();
        client.DefaultRequestHeaders.Add(RealtimeEndpoints.InternalKeyHeader, "");

        var response = await client.PostAsJsonAsync("/internal/order-events", SampleEvent, Ct);

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }
}
