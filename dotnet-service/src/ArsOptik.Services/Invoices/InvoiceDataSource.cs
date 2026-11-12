using ArsOptik.Services.Data;
using Microsoft.EntityFrameworkCore;

namespace ArsOptik.Services.Invoices;

public interface IInvoiceDataSource
{
    Task<InvoiceSource?> FindAsync(string orderNumber, CancellationToken cancellationToken);
}

/// <summary>Reads an order straight from the database, so invoices work even when NestJS is down.</summary>
public sealed class EfInvoiceDataSource(ArsOptikDbContext db) : IInvoiceDataSource
{
    public async Task<InvoiceSource?> FindAsync(string orderNumber, CancellationToken cancellationToken)
    {
        var order = await db.Orders
            .Include(o => o.User)
            .Include(o => o.Address)
            .Include(o => o.Payment)
            .Include(o => o.Items).ThenInclude(i => i.LensType)
            .Include(o => o.Items).ThenInclude(i => i.LensCoating)
            .Include(o => o.Items).ThenInclude(i => i.LensIndex)
            .AsSplitQuery()
            .SingleOrDefaultAsync(o => o.OrderNumber == orderNumber, cancellationToken);

        return order is null ? null : new InvoiceSource(order.UserId, ToInvoiceData(order));
    }

    private static InvoiceData ToInvoiceData(OrderRecord order) => new(
        order.OrderNumber,
        new DateTimeOffset(DateTime.SpecifyKind(order.CreatedAt, DateTimeKind.Utc)),
        InvoiceLabels.For(order.Status),
        InvoiceLabels.For(order.Payment?.Status),
        new InvoiceCustomer($"{order.User.FirstName} {order.User.LastName}".Trim(), order.User.Email),
        new InvoiceAddress(
            order.Address.FullName, order.Address.Phone, order.Address.AddressLine,
            order.Address.District, order.Address.City, order.Address.Zip),
        [.. order.Items.OrderBy(i => i.Id).Select(ToLine)],
        order.Subtotal,
        order.Shipping,
        order.Total);

    private static InvoiceLine ToLine(OrderItemRecord item)
    {
        string?[] details = [$"Renk: {item.SelectedColor}", item.LensType?.Name, item.LensCoating?.Name, item.LensIndex?.Name];

        var hasPrescription = item.PrescriptionOdSphere is { Length: > 0 } || item.PrescriptionOsSphere is { Length: > 0 }
            || item.PrescriptionOdCylinder is not null || item.PrescriptionOsCylinder is not null;

        return new InvoiceLine(
            item.ProductNameSnapshot,
            [.. details.OfType<string>()],
            item.Quantity,
            item.UnitPrice,
            hasPrescription
                ? new InvoicePrescription(
                    new InvoiceEye(item.PrescriptionOdSphere, item.PrescriptionOdCylinder, item.PrescriptionOdAxis),
                    new InvoiceEye(item.PrescriptionOsSphere, item.PrescriptionOsCylinder, item.PrescriptionOsAxis),
                    item.PrescriptionPupillaryDistance)
                : null);
    }
}
