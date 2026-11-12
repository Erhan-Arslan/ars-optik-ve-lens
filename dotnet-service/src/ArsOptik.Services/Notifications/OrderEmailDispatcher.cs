using System.Threading.Channels;
using ArsOptik.Services.Invoices;
using ArsOptik.Services.Realtime;

namespace ArsOptik.Services.Notifications;

/// <summary>
/// In-memory hand-off between the order-event endpoint and the e-mail worker, so NestJS gets its
/// 202 immediately. Jobs still queued are lost if the instance restarts; e-mails are courtesy
/// notifications and the order itself is safe in the database.
/// </summary>
public sealed class OrderEmailQueue
{
    private readonly Channel<OrderEvent> channel = Channel.CreateBounded<OrderEvent>(
        new BoundedChannelOptions(500) { FullMode = BoundedChannelFullMode.DropWrite, SingleReader = true });

    public bool TryEnqueue(OrderEvent orderEvent) => channel.Writer.TryWrite(orderEvent);

    public IAsyncEnumerable<OrderEvent> ReadAllAsync(CancellationToken cancellationToken) =>
        channel.Reader.ReadAllAsync(cancellationToken);
}

public sealed class OrderEmailDispatcher(
    OrderEmailQueue queue,
    IServiceScopeFactory scopes,
    ILogger<OrderEmailDispatcher> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var orderEvent in queue.ReadAllAsync(stoppingToken))
        {
            try
            {
                await SendAsync(orderEvent, stoppingToken);
            }
            catch (Exception error) when (error is not OperationCanceledException || !stoppingToken.IsCancellationRequested)
            {
                // One failed e-mail must not stop the worker.
                logger.LogError(error, "Order e-mail {Type} for {OrderNumber} failed", orderEvent.Type, orderEvent.OrderNumber);
            }
        }
    }

    private async Task SendAsync(OrderEvent orderEvent, CancellationToken cancellationToken)
    {
        using var scope = scopes.CreateScope();
        var source = await scope.ServiceProvider.GetRequiredService<IInvoiceDataSource>()
            .FindAsync(orderEvent.OrderNumber, cancellationToken);
        if (source is null)
        {
            logger.LogWarning("Order {OrderNumber} not found; no e-mail sent", orderEvent.OrderNumber);
            return;
        }

        var message = scope.ServiceProvider.GetRequiredService<OrderEmailComposer>().Compose(orderEvent, source.Data);
        if (message is null) return;

        var sender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
        await sender.SendAsync(message, cancellationToken);
        logger.LogInformation("Order e-mail {Tag} for {OrderNumber} handled by {Sender}",
            message.Tag, orderEvent.OrderNumber, sender.GetType().Name);
    }
}

public static class NotificationSetup
{
    public static IServiceCollection AddOrderEmails(this IServiceCollection services, IConfiguration configuration)
    {
        var options = new EmailOptions
        {
            BrevoApiKey = configuration["BREVO_API_KEY"],
            FromAddress = configuration["EMAIL_FROM_ADDRESS"],
        };
        if (configuration["EMAIL_FROM_NAME"] is { Length: > 0 } fromName) options.FromName = fromName;
        if (configuration["SITE_URL"] is { Length: > 0 } siteUrl) options.SiteUrl = siteUrl;

        services.AddSingleton(options);
        services.AddSingleton<OrderEmailQueue>();
        services.AddSingleton<OrderEmailComposer>();
        services.AddHostedService<OrderEmailDispatcher>();

        if (options.IsConfigured)
        {
            services.AddHttpClient<IEmailSender, BrevoEmailSender>(http => http.BaseAddress = new Uri("https://api.brevo.com/"))
                .AddStandardResilienceHandler(resilience =>
                {
                    resilience.AttemptTimeout.Timeout = TimeSpan.FromSeconds(20);
                    resilience.TotalRequestTimeout.Timeout = TimeSpan.FromSeconds(90);
                    resilience.CircuitBreaker.SamplingDuration = TimeSpan.FromSeconds(60);
                });
        }
        else
        {
            services.AddSingleton<IEmailSender, LoggingEmailSender>();
        }

        return services;
    }
}
