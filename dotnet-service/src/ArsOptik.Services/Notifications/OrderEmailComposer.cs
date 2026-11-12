using System.Globalization;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Unicode;
using ArsOptik.Services.Invoices;
using ArsOptik.Services.Realtime;

namespace ArsOptik.Services.Notifications;

/// <summary>
/// Builds the customer e-mail for an order event, or null when the event needs none
/// (e.g. an order moved back to "hazırlanıyor"). Every customer-entered value is HTML-encoded.
/// </summary>
public sealed class OrderEmailComposer(EmailOptions options)
{
    private const string Gold = "#C89A3E";
    private const string Ink900 = "#16110C";
    private const string Ink500 = "#6B5B49";
    private const string Ink100 = "#EDE8E1";
    private const string Page = "#F7F5F2";

    private static readonly CultureInfo Turkish = CultureInfo.GetCultureInfo("tr-TR");

    // Escapes markup characters (<, >, &, quotes) but keeps Turkish letters readable in the source.
    private static readonly HtmlEncoder Html = HtmlEncoder.Create(UnicodeRanges.All);

    private sealed record Template(string Tag, string Subject, string Heading, string Intro, bool IncludeItems, bool AttachInvoice);

    public EmailMessage? Compose(OrderEvent orderEvent, InvoiceData order)
    {
        var template = TemplateFor(orderEvent, order);
        if (template is null) return null;

        var attachments = template.AttachInvoice
            ? new[] { new EmailAttachment($"ARS-Optik-{order.OrderNumber}.pdf", InvoiceDocument.GeneratePdf(order, DateTimeOffset.UtcNow)) }
            : [];

        return new EmailMessage(
            order.Customer.Email,
            order.Customer.Name,
            template.Subject,
            RenderHtml(template, order),
            RenderText(template, order),
            template.Tag,
            attachments);
    }

    private static Template? TemplateFor(OrderEvent orderEvent, InvoiceData order)
    {
        var number = $"#{order.OrderNumber}";
        if (orderEvent.Type == OrderEvent.Created)
        {
            return new Template("order-confirmation", $"Siparişiniz alındı — {number}",
                "Siparişiniz için teşekkürler",
                $"{number} numaralı siparişinizi aldık ve hazırlamaya başladık. Sipariş özetiniz aşağıda; proforma faturanız ekte.",
                IncludeItems: true, AttachInvoice: true);
        }

        return orderEvent.Status switch
        {
            "kargoda" => new Template("order-shipped", $"Siparişiniz kargoya verildi — {number}",
                "Siparişiniz yola çıktı",
                $"{number} numaralı siparişiniz kargoya verildi. Teslimat adresiniz: {FormatAddress(order.DeliveryAddress)}.",
                IncludeItems: true, AttachInvoice: false),
            "teslim-edildi" => new Template("order-delivered", $"Siparişiniz teslim edildi — {number}",
                "Siparişiniz teslim edildi",
                $"{number} numaralı siparişiniz teslim edildi. Yeni gözlüğünüzü güzel günlerde kullanmanızı dileriz.",
                IncludeItems: false, AttachInvoice: false),
            "iptal" => new Template("order-cancelled", $"Siparişiniz iptal edildi — {number}",
                "Siparişiniz iptal edildi",
                $"{number} numaralı siparişiniz iptal edildi. Bir sorunuz varsa bu e-postayı yanıtlayarak bize ulaşabilirsiniz.",
                IncludeItems: true, AttachInvoice: false),
            _ => null,
        };
    }

    private string RenderHtml(Template template, InvoiceData order)
    {
        static string E(string value) => Html.Encode(value);
        var site = options.SiteUrl.TrimEnd('/');

        var items = new StringBuilder();
        if (template.IncludeItems)
        {
            foreach (var line in order.Lines)
            {
                items.Append($"""
                    <tr>
                      <td style="padding:12px 0;border-bottom:1px solid {Ink100};">
                        <div style="font-weight:600;color:{Ink900};">{E(line.ProductName)} <span style="font-weight:400;color:{Ink500};">× {line.Quantity}</span></div>
                        <div style="font-size:12px;color:{Ink500};margin-top:2px;">{E(string.Join(" · ", line.Details))}</div>
                      </td>
                      <td style="padding:12px 0;border-bottom:1px solid {Ink100};text-align:right;white-space:nowrap;color:{Ink900};">{Money(line.LineTotal)}</td>
                    </tr>
                    """);
            }
            items.Append($"""
                <tr><td style="padding:10px 0 2px;color:{Ink500};">Kargo</td><td style="padding:10px 0 2px;text-align:right;color:{Ink900};">{(order.Shipping == 0 ? "Ücretsiz" : Money(order.Shipping))}</td></tr>
                <tr><td style="padding:2px 0;font-weight:700;color:{Ink900};">Toplam</td><td style="padding:2px 0;text-align:right;font-weight:700;color:{Ink900};">{Money(order.Total)}</td></tr>
                """);
        }

        return $"""
            <!doctype html>
            <html lang="tr">
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{E(template.Subject)}</title></head>
            <body style="margin:0;padding:0;background:{Page};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{Page};">
                <tr><td align="center" style="padding:32px 16px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;font-family:Manrope,'Segoe UI',Arial,sans-serif;font-size:14px;line-height:1.6;color:{Ink900};">
                    <tr><td style="padding:28px 32px 0;">
                      <img src="{site}/logo.png" width="72" alt="ARS Optik ve Lens" style="display:block;border:0;">
                    </td></tr>
                    <tr><td style="padding:16px 32px 0;"><div style="height:2px;background:{Gold};"></div></td></tr>
                    <tr><td style="padding:24px 32px 8px;">
                      <h1 style="margin:0 0 8px;font-family:Fraunces,Georgia,serif;font-size:24px;line-height:1.25;font-weight:600;color:{Ink900};">{E(template.Heading)}</h1>
                      <p style="margin:0 0 4px;color:{Ink500};">Merhaba {E(order.Customer.Name)},</p>
                      <p style="margin:0;">{E(template.Intro)}</p>
                    </td></tr>
                    {(template.IncludeItems ? $"""<tr><td style="padding:8px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">{items}</table></td></tr>""" : "")}
                    <tr><td style="padding:24px 32px 32px;">
                      <a href="{site}/hesabim" style="display:inline-block;background:{Gold};color:{Ink900};text-decoration:none;font-weight:600;padding:12px 24px;border-radius:999px;">Siparişlerimi görüntüle</a>
                    </td></tr>
                  </table>
                  <p style="max-width:560px;margin:16px auto 0;font-family:Arial,sans-serif;font-size:11px;color:{Ink500};">
                    Bu e-posta, ARS Optik ve Lens'te verdiğiniz #{E(order.OrderNumber)} numaralı sipariş hakkında bilgilendirme amacıyla gönderildi.
                  </p>
                </td></tr>
              </table>
            </body>
            </html>
            """;
    }

    private string RenderText(Template template, InvoiceData order)
    {
        var text = new StringBuilder()
            .AppendLine(template.Heading)
            .AppendLine()
            .AppendLine($"Merhaba {order.Customer.Name},")
            .AppendLine(template.Intro)
            .AppendLine();

        if (template.IncludeItems)
        {
            foreach (var line in order.Lines)
            {
                text.AppendLine($"- {line.ProductName} × {line.Quantity}: {Money(line.LineTotal)}");
            }
            text.AppendLine($"Kargo: {(order.Shipping == 0 ? "Ücretsiz" : Money(order.Shipping))}")
                .AppendLine($"Toplam: {Money(order.Total)}")
                .AppendLine();
        }

        return text.AppendLine($"Siparişlerinizi görüntüleyin: {options.SiteUrl.TrimEnd('/')}/hesabim").ToString();
    }

    private static string FormatAddress(InvoiceAddress address) =>
        $"{address.AddressLine}, {address.District} / {address.City}";

    private static string Money(decimal amount) => amount.ToString("C2", Turkish);
}
