using System.Net;
using System.Text;
using ArsOptik.Services.Auth;
using ArsOptik.Services.Invoices;

namespace ArsOptik.Services.Tests;

public sealed class InvoiceTests(ServiceFactory factory) : IClassFixture<ServiceFactory>
{
    private const string Url = "/orders/ARS123456/invoice";

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    private Task<HttpResponseMessage> DownloadAs(AppUser user, string url = Url) =>
        factory.CreateClientWithToken(ServiceFactory.CreateToken(user.Id, user.Email)).GetAsync(url, Ct);

    [Fact]
    public void Renders_turkish_text_and_lira_sign_with_the_embedded_fonts()
    {
        // ThrowOnMissingTextGlyphs is on, so a missing glyph (ş, İ, ₺ …) fails generation.
        var pdf = InvoiceDocument.GeneratePdf(ServiceFactory.SampleInvoice, DateTimeOffset.UtcNow);

        Assert.Equal("%PDF", Encoding.ASCII.GetString(pdf, 0, 4));
        Assert.True(pdf.Length > 10_000, $"PDF unexpectedly small: {pdf.Length} bytes");
    }

    [Fact]
    public async Task Owner_downloads_their_invoice_as_pdf()
    {
        var response = await DownloadAs(ServiceFactory.Customer);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/pdf", response.Content.Headers.ContentType?.MediaType);
        var disposition = response.Content.Headers.ContentDisposition;
        Assert.Equal("ARS-Optik-ARS123456.pdf", disposition?.FileNameStar ?? disposition?.FileName);
        Assert.Contains("no-store", response.Headers.CacheControl?.ToString());
    }

    [Fact]
    public async Task Admin_can_download_any_invoice()
    {
        var response = await DownloadAs(ServiceFactory.Admin);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Other_customers_get_not_found_rather_than_forbidden()
    {
        var response = await DownloadAs(ServiceFactory.OtherCustomer);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Unknown_orders_are_not_found()
    {
        var response = await DownloadAs(ServiceFactory.Customer, "/orders/ARS000000/invoice");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Requires_sign_in()
    {
        var response = await factory.CreateClient().GetAsync(Url, Ct);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
