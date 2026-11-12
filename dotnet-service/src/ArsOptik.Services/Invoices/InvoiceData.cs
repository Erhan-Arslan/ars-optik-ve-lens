using ArsOptik.Services.Data;

namespace ArsOptik.Services.Invoices;

/// <summary>Everything printed on the proforma invoice, independent of how it was loaded.</summary>
public sealed record InvoiceData(
    string OrderNumber,
    DateTimeOffset OrderedAt,
    string StatusLabel,
    string PaymentLabel,
    InvoiceCustomer Customer,
    InvoiceAddress DeliveryAddress,
    IReadOnlyList<InvoiceLine> Lines,
    decimal Subtotal,
    decimal Shipping,
    decimal Total);

public sealed record InvoiceCustomer(string Name, string Email);

public sealed record InvoiceAddress(string FullName, string Phone, string AddressLine, string District, string City, string Zip);

/// <param name="Details">Colour and lens choices, shown under the product name.</param>
public sealed record InvoiceLine(
    string ProductName,
    IReadOnlyList<string> Details,
    int Quantity,
    decimal UnitPrice,
    InvoicePrescription? Prescription)
{
    public decimal LineTotal => UnitPrice * Quantity;
}

public sealed record InvoicePrescription(InvoiceEye Right, InvoiceEye Left, decimal? PupillaryDistance);

public sealed record InvoiceEye(string? Sphere, decimal? Cylinder, int? Axis);

/// <summary>An order's invoice data plus who may download it.</summary>
public sealed record InvoiceSource(string OwnerUserId, InvoiceData Data);

public static class InvoiceLabels
{
    public static string For(OrderStatus status) => status switch
    {
        OrderStatus.Hazirlaniyor => "Hazırlanıyor",
        OrderStatus.Kargoda => "Kargoda",
        OrderStatus.TeslimEdildi => "Teslim Edildi",
        OrderStatus.Iptal => "İptal Edildi",
        _ => status.ToString(),
    };

    public static string For(PaymentStatus? status) => status switch
    {
        PaymentStatus.Paid => "Ödendi",
        PaymentStatus.Pending => "Ödeme bekleniyor",
        PaymentStatus.Failed => "Ödeme başarısız",
        PaymentStatus.Refunded => "İade edildi",
        _ => "Bilinmiyor",
    };
}
