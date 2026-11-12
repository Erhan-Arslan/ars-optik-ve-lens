using System.Net.Http.Headers;
using System.Text.Json.Serialization;

namespace ArsOptik.Services.Notifications;

public sealed record EmailMessage(
    string ToAddress,
    string ToName,
    string Subject,
    string Html,
    string Text,
    string Tag,
    IReadOnlyList<EmailAttachment> Attachments);

public sealed record EmailAttachment(string FileName, byte[] Content);

public interface IEmailSender
{
    Task SendAsync(EmailMessage message, CancellationToken cancellationToken);
}

public sealed class EmailOptions
{
    public string? BrevoApiKey { get; set; }
    public string? FromAddress { get; set; }
    public string FromName { get; set; } = "ARS Optik ve Lens";
    public string SiteUrl { get; set; } = "https://erhan-arslan.github.io/ars-optik-ve-lens";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(BrevoApiKey) && !string.IsNullOrWhiteSpace(FromAddress);
}

/// <summary>
/// Sends through Brevo's HTTPS API. SMTP is not an option: Render's free instances block
/// outbound SMTP ports. Transient failures are retried by the HttpClient's resilience handler.
/// </summary>
public sealed class BrevoEmailSender(HttpClient http, EmailOptions options) : IEmailSender
{
    public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken)
    {
        var request = new BrevoRequest(
            new BrevoContact(options.FromAddress!, options.FromName),
            [new BrevoContact(message.ToAddress, message.ToName)],
            // Replies reach the shop's own mailbox.
            new BrevoContact(options.FromAddress!, options.FromName),
            message.Subject,
            message.Html,
            message.Text,
            message.Attachments.Count == 0
                ? null
                : [.. message.Attachments.Select(a => new BrevoAttachment(a.FileName, Convert.ToBase64String(a.Content)))],
            [message.Tag]);

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "v3/smtp/email") { Content = JsonContent.Create(request) };
        httpRequest.Headers.Add("api-key", options.BrevoApiKey);
        httpRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        using var response = await http.SendAsync(httpRequest, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException($"Brevo rejected the email: HTTP {(int)response.StatusCode} {body}", null, response.StatusCode);
        }
    }

    private sealed record BrevoRequest(
        BrevoContact Sender,
        IReadOnlyList<BrevoContact> To,
        BrevoContact ReplyTo,
        string Subject,
        string HtmlContent,
        string TextContent,
        [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] IReadOnlyList<BrevoAttachment>? Attachment,
        IReadOnlyList<string> Tags);

    private sealed record BrevoContact(string Email, string Name);

    private sealed record BrevoAttachment(string Name, string Content);
}

/// <summary>Used when Brevo is not configured (local development): logs instead of sending.</summary>
public sealed class LoggingEmailSender(ILogger<LoggingEmailSender> logger) : IEmailSender
{
    public Task SendAsync(EmailMessage message, CancellationToken cancellationToken)
    {
        logger.LogInformation("E-posta gönderimi yapılandırılmamış; atlandı: {Tag} → {To} ({Subject})",
            message.Tag, message.ToAddress, message.Subject);
        return Task.CompletedTask;
    }
}
