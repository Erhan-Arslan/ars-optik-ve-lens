using System.Threading.Channels;
using ArsOptik.Services.Notifications;

namespace ArsOptik.Services.Tests;

/// <summary>Stands in for Brevo: keeps sent e-mails so tests can await them.</summary>
public sealed class RecordingEmailSender : IEmailSender
{
    private static readonly TimeSpan WaitLimit = TimeSpan.FromSeconds(15);

    private readonly Channel<EmailMessage> sent = Channel.CreateUnbounded<EmailMessage>();

    public Task SendAsync(EmailMessage message, CancellationToken cancellationToken)
    {
        sent.Writer.TryWrite(message);
        return Task.CompletedTask;
    }

    /// <summary>Next e-mail with the given tag; e-mails with other tags are skipped.</summary>
    public async Task<EmailMessage> NextAsync(string tag, CancellationToken cancellationToken)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(WaitLimit);
        while (true)
        {
            var message = await sent.Reader.ReadAsync(timeout.Token);
            if (message.Tag == tag) return message;
        }
    }

    public async Task<EmailMessage> NextAnyAsync(CancellationToken cancellationToken)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(WaitLimit);
        return await sent.Reader.ReadAsync(timeout.Token);
    }
}
