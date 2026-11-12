using System.Globalization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ArsOptik.Services.Invoices;

/// <summary>A4 proforma invoice in the shop's brand palette (frontend/src/index.css @theme).</summary>
public sealed class InvoiceDocument(InvoiceData invoice, DateTimeOffset generatedAt) : IDocument
{
    private const string Gold500 = "#C89A3E";
    private const string Gold100 = "#F5E7C9";
    private const string Gold50 = "#FBF5E9";
    private const string Bronze600 = "#7E4C1D";
    private const string Ink900 = "#16110C";
    private const string Ink800 = "#241C15";
    private const string Ink500 = "#6B5B49";
    private const string Ink200 = "#D8CFC2";
    private const string Ink100 = "#EDE8E1";

    private static readonly CultureInfo Turkish = CultureInfo.GetCultureInfo("tr-TR");
    private static readonly TimeZoneInfo Istanbul = TimeZoneInfo.FindSystemTimeZoneById("Europe/Istanbul");

    public static byte[] GeneratePdf(InvoiceData invoice, DateTimeOffset generatedAt)
    {
        InvoiceAssets.EnsureInitialised();
        return new InvoiceDocument(invoice, generatedAt).GeneratePdf();
    }

    public DocumentMetadata GetMetadata() => new()
    {
        Title = $"Proforma Fatura #{invoice.OrderNumber}",
        Author = "ARS Optik ve Lens",
        Subject = "Sipariş özeti (proforma)",
        Language = "tr-TR",
        CreationDate = generatedAt,
        ModifiedDate = generatedAt,
    };

    public DocumentSettings GetSettings() => DocumentSettings.Default;

    public void Compose(IDocumentContainer container) =>
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.MarginHorizontal(44);
            page.MarginVertical(40);
            page.PageColor(Colors.White);
            page.DefaultTextStyle(style => style.FontFamily(InvoiceAssets.BodyFont).FontSize(9.5f).FontColor(Ink800));

            page.Header().Element(ComposeHeader);
            page.Content().PaddingTop(24).Element(ComposeContent);
            page.Footer().Element(ComposeFooter);
        });

    private void ComposeHeader(IContainer container) =>
        container.Column(column =>
        {
            column.Item().Row(row =>
            {
                row.RelativeItem().Row(brand =>
                {
                    brand.ConstantItem(64).Height(52).Image(InvoiceAssets.Logo).FitArea();
                    brand.RelativeItem().PaddingLeft(10).AlignMiddle().Column(text =>
                    {
                        text.Item().Text("ARS Optik ve Lens").FontFamily(InvoiceAssets.DisplayFont).FontSize(15).FontColor(Ink900);
                        text.Item().Text("erhan-arslan.github.io/ars-optik-ve-lens").FontSize(8).FontColor(Ink500);
                    });
                });

                row.ConstantItem(210).AlignRight().Column(meta =>
                {
                    meta.Item().AlignRight().Text("PROFORMA FATURA")
                        .FontFamily(InvoiceAssets.DisplayFont).FontSize(17).FontColor(Bronze600).LetterSpacing(0.04f);
                    meta.Item().PaddingTop(6).AlignRight().Text(text =>
                    {
                        text.Span("Sipariş No  ").FontColor(Ink500);
                        text.Span($"#{invoice.OrderNumber}").SemiBold().FontColor(Ink900);
                    });
                    meta.Item().AlignRight().Text(text =>
                    {
                        text.Span("Tarih  ").FontColor(Ink500);
                        text.Span(FormatDateTime(invoice.OrderedAt));
                    });
                });
            });

            column.Item().PaddingTop(16).LineHorizontal(1.5f).LineColor(Gold500);
        });

    private void ComposeContent(IContainer container) =>
        container.Column(column =>
        {
            column.Spacing(20);
            column.Item().Element(ComposeParties);
            column.Item().Element(ComposeLines);
            column.Item().AlignRight().Width(240).Element(ComposeTotals);
        });

    private void ComposeParties(IContainer container) =>
        container.Row(row =>
        {
            row.Spacing(16);
            row.RelativeItem().Element(box => Panel(box, "Müşteri", panel =>
            {
                panel.Item().Text(invoice.Customer.Name).SemiBold().FontColor(Ink900);
                panel.Item().Text(invoice.Customer.Email).FontColor(Ink500);
            }));

            // The address gets the most room so street lines do not wrap mid-number.
            row.RelativeItem(1.5f).Element(box => Panel(box, "Teslimat Adresi", panel =>
            {
                var address = invoice.DeliveryAddress;
                panel.Item().Text(address.FullName).SemiBold().FontColor(Ink900);
                panel.Item().Text(address.AddressLine);
                panel.Item().Text($"{address.District} / {address.City} {address.Zip}");
                panel.Item().Text(address.Phone).FontColor(Ink500);
            }));

            row.RelativeItem(0.8f).Element(box => Panel(box, "Durum", panel =>
            {
                panel.Item().Text(text =>
                {
                    text.Span("Sipariş: ").FontColor(Ink500);
                    text.Span(invoice.StatusLabel).SemiBold().FontColor(Ink900);
                });
                panel.Item().Text(text =>
                {
                    text.Span("Ödeme: ").FontColor(Ink500);
                    text.Span(invoice.PaymentLabel).SemiBold().FontColor(Ink900);
                });
            }));
        });

    private static void Panel(IContainer container, string title, Action<ColumnDescriptor> content) =>
        container.Background(Gold50).Border(0.75f).BorderColor(Gold100).Padding(12).Column(column =>
        {
            column.Spacing(2);
            column.Item().PaddingBottom(4).Text(title.ToUpper(Turkish)).FontSize(7.5f).SemiBold().LetterSpacing(0.08f).FontColor(Bronze600);
            content(column);
        });

    private void ComposeLines(IContainer container) =>
        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.ConstantColumn(22);
                columns.RelativeColumn();
                columns.ConstantColumn(42);
                columns.ConstantColumn(82);
                columns.ConstantColumn(82);
            });

            table.Header(header =>
            {
                header.Cell().Element(HeaderCell).Text("#");
                header.Cell().Element(HeaderCell).Text("Ürün");
                header.Cell().Element(HeaderCell).AlignRight().Text("Adet");
                header.Cell().Element(HeaderCell).AlignRight().Text("Birim Fiyat");
                header.Cell().Element(HeaderCell).AlignRight().Text("Tutar");
            });

            for (var i = 0; i < invoice.Lines.Count; i++)
            {
                var line = invoice.Lines[i];
                table.Cell().Element(BodyCell).Text($"{i + 1}").FontColor(Ink500);
                table.Cell().Element(BodyCell).Column(cell =>
                {
                    cell.Item().Text(line.ProductName).SemiBold().FontColor(Ink900);
                    cell.Item().Text(string.Join(" · ", line.Details)).FontSize(8).FontColor(Ink500);
                    if (line.Prescription is { } prescription)
                    {
                        cell.Item().PaddingTop(6).Element(c => ComposePrescription(c, prescription));
                    }
                });
                table.Cell().Element(BodyCell).AlignRight().Text($"{line.Quantity}");
                table.Cell().Element(BodyCell).AlignRight().Text(Money(line.UnitPrice));
                table.Cell().Element(BodyCell).AlignRight().Text(Money(line.LineTotal)).SemiBold().FontColor(Ink900);
            }
        });

    private static IContainer HeaderCell(IContainer container) =>
        container.Background(Ink100).PaddingVertical(7).PaddingHorizontal(6)
            .DefaultTextStyle(style => style.FontSize(7.5f).SemiBold().LetterSpacing(0.06f).FontColor(Ink500));

    private static IContainer BodyCell(IContainer container) =>
        container.BorderBottom(0.75f).BorderColor(Ink100).PaddingVertical(9).PaddingHorizontal(6);

    private static void ComposePrescription(IContainer container, InvoicePrescription prescription) =>
        container.Border(0.5f).BorderColor(Ink200).Padding(6).Column(column =>
        {
            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(56);
                    columns.ConstantColumn(46);
                    columns.ConstantColumn(46);
                    columns.ConstantColumn(40);
                });

                foreach (var heading in new[] { "Reçete", "SPH", "CYL", "AKS" })
                {
                    table.Cell().Text(heading).FontSize(7).SemiBold().FontColor(Ink500);
                }

                foreach (var (label, eye) in new[] { ("Sağ (OD)", prescription.Right), ("Sol (OS)", prescription.Left) })
                {
                    table.Cell().Text(label).FontSize(8);
                    table.Cell().Text(Power(eye.Sphere)).FontSize(8);
                    table.Cell().Text(eye.Cylinder is { } cyl ? Power(cyl) : "—").FontSize(8);
                    table.Cell().Text(eye.Axis is { } axis ? $"{axis}°" : "—").FontSize(8);
                }
            });

            column.Item().PaddingTop(3).Text(prescription.PupillaryDistance is { } pd
                ? $"PD: {pd.ToString("0.#", Turkish)} mm"
                : "PD: belirtilmedi").FontSize(7.5f).FontColor(Ink500);
        });

    private void ComposeTotals(IContainer container) =>
        container.Column(column =>
        {
            column.Item().Element(c => TotalRow(c, "Ara Toplam", Money(invoice.Subtotal)));
            column.Item().Element(c => TotalRow(c, "Kargo", invoice.Shipping == 0 ? "Ücretsiz" : Money(invoice.Shipping)));
            column.Item().PaddingTop(6).Background(Gold500).PaddingVertical(9).PaddingHorizontal(10).Row(row =>
            {
                row.RelativeItem().Text("Genel Toplam").SemiBold().FontColor(Ink900);
                row.AutoItem().Text(Money(invoice.Total)).FontFamily(InvoiceAssets.DisplayFont).FontSize(13).FontColor(Ink900);
            });
        });

    private static void TotalRow(IContainer container, string label, string value) =>
        container.BorderBottom(0.75f).BorderColor(Ink100).PaddingVertical(6).PaddingHorizontal(10).Row(row =>
        {
            row.RelativeItem().Text(label).FontColor(Ink500);
            row.AutoItem().Text(value);
        });

    private void ComposeFooter(IContainer container) =>
        container.Column(column =>
        {
            column.Item().LineHorizontal(0.75f).LineColor(Ink100);
            column.Item().PaddingTop(8).Row(row =>
            {
                row.RelativeItem().Column(note =>
                {
                    note.Item().Text("Bu belge proforma niteliğindedir; vergi hükmü taşımaz ve e-Arşiv fatura yerine geçmez.")
                        .FontSize(7.5f).FontColor(Ink500);
                    note.Item().Text($"Oluşturulma: {FormatDateTime(generatedAt)}").FontSize(7.5f).FontColor(Ink500);
                });
                row.AutoItem().AlignBottom().Text(text =>
                {
                    text.DefaultTextStyle(style => style.FontSize(7.5f).FontColor(Ink500));
                    text.Span("Sayfa ");
                    text.CurrentPageNumber();
                    text.Span(" / ");
                    text.TotalPages();
                });
            });
        });

    private static string Money(decimal amount) => amount.ToString("C2", Turkish);

    private static string Power(decimal value) =>
        (value > 0 ? "+" : "") + value.ToString("0.00", Turkish);

    /// <summary>Spheres are stored as written ("-1.25"); show them with a Turkish decimal comma.</summary>
    private static string Power(string? value) =>
        decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out var parsed) ? Power(parsed) : "—";

    private static string FormatDateTime(DateTimeOffset value) =>
        TimeZoneInfo.ConvertTime(value, Istanbul).ToString("d MMMM yyyy, HH:mm", Turkish);
}
