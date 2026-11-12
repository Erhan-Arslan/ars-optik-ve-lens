using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using ArsOptik.Services.Notifications;
using ArsOptik.Services.Realtime;

namespace ArsOptik.Services.Tests;

public sealed class OrderEmailTests(ServiceFactory factory) : IClassFixture<ServiceFactory>
{
    private CancellationToken Ct => TestContext.Current.CancellationToken;

    private static OrderEvent Event(string type, string status) =>
        new(type, "order-1", ServiceFactory.SampleInvoice.OrderNumber, status, 8750m, 2, "Ayşe Yılmaz", DateTimeOffset.UtcNow);

    private async Task PublishAsync(OrderEvent orderEvent)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(RealtimeEndpoints.InternalKeyHeader, ServiceFactory.InternalApiKey);
        var response = await client.PostAsJsonAsync("/internal/order-events", orderEvent, Ct);
        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
    }

    [Fact]
    public async Task New_order_sends_confirmation_with_the_proforma_invoice_attached()
    {
        await PublishAsync(Event(OrderEvent.Created, "hazirlaniyor"));

        var email = await factory.Emails.NextAsync("order-confirmation", Ct);

        Assert.Equal(ServiceFactory.Customer.Email, email.ToAddress);
        Assert.Equal("Siparişiniz alındı — #ARS123456", email.Subject);
        Assert.Contains("Leo Yuvarlak Çerçeve", email.Html);
        Assert.Contains("₺8.750,00", email.Text);
        var attachment = Assert.Single(email.Attachments);
        Assert.Equal("ARS-Optik-ARS123456.pdf", attachment.FileName);
        Assert.Equal("%PDF", Encoding.ASCII.GetString(attachment.Content, 0, 4));
    }

    [Fact]
    public async Task Status_changes_send_the_matching_email_and_skip_the_rest()
    {
        // Moving back to "hazırlanıyor" has no e-mail. The worker is sequential, so the next e-mail
        // after both events must be the shipping one.
        await PublishAsync(Event(OrderEvent.StatusChanged, "hazirlaniyor"));
        await PublishAsync(Event(OrderEvent.StatusChanged, "kargoda"));

        var email = await factory.Emails.NextAnyAsync(Ct);

        Assert.Equal("order-shipped", email.Tag);
        Assert.Equal("Siparişiniz kargoya verildi — #ARS123456", email.Subject);
        Assert.Empty(email.Attachments);
    }

    [Fact]
    public void Customer_entered_text_is_html_encoded()
    {
        var hostile = ServiceFactory.SampleInvoice with { Customer = new("<script>alert(1)</script>", "x@example.com") };
        var composer = new OrderEmailComposer(new EmailOptions());

        var email = composer.Compose(Event(OrderEvent.StatusChanged, "teslim-edildi"), hostile)!;

        Assert.DoesNotContain("<script>", email.Html);
        Assert.Contains("&lt;script&gt;", email.Html);
    }

    [Fact]
    public async Task Brevo_sender_posts_the_expected_request()
    {
        var handler = new CapturingHandler();
        var options = new EmailOptions { BrevoApiKey = "test-key", FromAddress = "magaza@example.com" };
        var sender = new BrevoEmailSender(new HttpClient(handler) { BaseAddress = new Uri("https://api.brevo.com/") }, options);
        var message = new EmailMessage("ayse@example.com", "Ayşe Yılmaz", "Konu", "<p>Merhaba</p>", "Merhaba", "order-shipped",
            [new EmailAttachment("belge.pdf", [1, 2, 3])]);

        await sender.SendAsync(message, Ct);

        Assert.Equal("https://api.brevo.com/v3/smtp/email", handler.Request!.RequestUri!.ToString());
        Assert.Equal("test-key", handler.Request.Headers.GetValues("api-key").Single());
        using var json = JsonDocument.Parse(handler.Body!);
        var root = json.RootElement;
        Assert.Equal("magaza@example.com", root.GetProperty("sender").GetProperty("email").GetString());
        Assert.Equal("ayse@example.com", root.GetProperty("to")[0].GetProperty("email").GetString());
        Assert.Equal("magaza@example.com", root.GetProperty("replyTo").GetProperty("email").GetString());
        Assert.Equal("AQID", root.GetProperty("attachment")[0].GetProperty("content").GetString());
        Assert.Equal("order-shipped", root.GetProperty("tags")[0].GetString());
    }

    [Fact]
    public async Task Brevo_errors_surface_as_exceptions()
    {
        var sender = new BrevoEmailSender(
            new HttpClient(new CapturingHandler(HttpStatusCode.Unauthorized)) { BaseAddress = new Uri("https://api.brevo.com/") },
            new EmailOptions { BrevoApiKey = "wrong", FromAddress = "magaza@example.com" });

        await Assert.ThrowsAsync<HttpRequestException>(() =>
            sender.SendAsync(new EmailMessage("a@example.com", "A", "K", "<p/>", "", "t", []), Ct));
    }

    private sealed class CapturingHandler(HttpStatusCode status = HttpStatusCode.Created) : HttpMessageHandler
    {
        public HttpRequestMessage? Request { get; private set; }
        public string? Body { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Request = request;
            Body = await request.Content!.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(status) { Content = new StringContent("{}") };
        }
    }
}
