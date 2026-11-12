using Microsoft.EntityFrameworkCore;

namespace ArsOptik.Services.Data;

// Read-only mirrors of the Prisma order tables (orders, order_items, addresses, payments and the
// lens option tables), mapped column by column because Prisma uses camelCase quoted names.

public sealed class OrderRecord
{
    public required string Id { get; init; }
    public required string OrderNumber { get; init; }
    public required string UserId { get; init; }
    public required string AddressId { get; init; }
    public required OrderStatus Status { get; init; }
    public required decimal Subtotal { get; init; }
    public required decimal Shipping { get; init; }
    public required decimal Total { get; init; }
    /// <summary>Prisma writes UTC into a <c>timestamp without time zone</c> column.</summary>
    public required DateTime CreatedAt { get; init; }

    public UserRecord User { get; init; } = null!;
    public AddressRecord Address { get; init; } = null!;
    public PaymentRecord? Payment { get; init; }
    public List<OrderItemRecord> Items { get; init; } = [];
}

public sealed class OrderItemRecord
{
    public required string Id { get; init; }
    public required string OrderId { get; init; }
    public required string ProductNameSnapshot { get; init; }
    public required decimal UnitPrice { get; init; }
    public required int Quantity { get; init; }
    public required string SelectedColor { get; init; }
    public string? LensTypeId { get; init; }
    public string? LensCoatingId { get; init; }
    public string? LensIndexId { get; init; }
    public string? PrescriptionOdSphere { get; init; }
    public string? PrescriptionOsSphere { get; init; }
    public decimal? PrescriptionOdCylinder { get; init; }
    public decimal? PrescriptionOsCylinder { get; init; }
    public int? PrescriptionOdAxis { get; init; }
    public int? PrescriptionOsAxis { get; init; }
    public decimal? PrescriptionPupillaryDistance { get; init; }

    public LensTypeRecord? LensType { get; init; }
    public LensCoatingRecord? LensCoating { get; init; }
    public LensIndexRecord? LensIndex { get; init; }
}

public sealed class AddressRecord
{
    public required string Id { get; init; }
    public required string FullName { get; init; }
    public required string Phone { get; init; }
    public required string City { get; init; }
    public required string District { get; init; }
    public required string AddressLine { get; init; }
    public required string Zip { get; init; }
}

public sealed class PaymentRecord
{
    public required string Id { get; init; }
    public required string OrderId { get; init; }
    public required PaymentStatus Status { get; init; }
}

// Lens types and coatings live in separate tables; only their display names are needed here.
public sealed class LensTypeRecord
{
    public required string Id { get; init; }
    public required string Name { get; init; }
}

public sealed class LensCoatingRecord
{
    public required string Id { get; init; }
    public required string Name { get; init; }
}

/// <summary>Mirrors the Prisma <c>OrderStatus</c> Postgres enum.</summary>
public enum OrderStatus
{
    Hazirlaniyor,
    Kargoda,
    TeslimEdildi,
    Iptal,
}

/// <summary>Mirrors the Prisma <c>PaymentStatus</c> Postgres enum.</summary>
public enum PaymentStatus
{
    Pending,
    Paid,
    Failed,
    Refunded,
}

internal static class OrderModelConfiguration
{
    public static void ConfigureOrders(this ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrderRecord>(order =>
        {
            order.ToTable("orders");
            order.HasKey(o => o.Id);
            order.Property(o => o.Id).HasColumnName("id");
            order.Property(o => o.OrderNumber).HasColumnName("orderNumber");
            order.Property(o => o.UserId).HasColumnName("userId");
            order.Property(o => o.AddressId).HasColumnName("addressId");
            order.Property(o => o.Status).HasColumnName("status");
            order.Property(o => o.Subtotal).HasColumnName("subtotal");
            order.Property(o => o.Shipping).HasColumnName("shipping");
            order.Property(o => o.Total).HasColumnName("total");
            order.Property(o => o.CreatedAt).HasColumnName("createdAt").HasColumnType("timestamp(3) without time zone");
            order.HasOne(o => o.User).WithMany().HasForeignKey(o => o.UserId);
            order.HasOne(o => o.Address).WithMany().HasForeignKey(o => o.AddressId);
            order.HasOne(o => o.Payment).WithOne().HasForeignKey<PaymentRecord>(p => p.OrderId);
            order.HasMany(o => o.Items).WithOne().HasForeignKey(i => i.OrderId);
        });

        modelBuilder.Entity<OrderItemRecord>(item =>
        {
            item.ToTable("order_items");
            item.HasKey(i => i.Id);
            item.Property(i => i.Id).HasColumnName("id");
            item.Property(i => i.OrderId).HasColumnName("orderId");
            item.Property(i => i.ProductNameSnapshot).HasColumnName("productNameSnapshot");
            item.Property(i => i.UnitPrice).HasColumnName("unitPrice");
            item.Property(i => i.Quantity).HasColumnName("quantity");
            item.Property(i => i.SelectedColor).HasColumnName("selectedColor");
            item.Property(i => i.LensTypeId).HasColumnName("lensTypeId");
            item.Property(i => i.LensCoatingId).HasColumnName("lensCoatingId");
            item.Property(i => i.LensIndexId).HasColumnName("lensIndexId");
            item.Property(i => i.PrescriptionOdSphere).HasColumnName("prescriptionOdSphere");
            item.Property(i => i.PrescriptionOsSphere).HasColumnName("prescriptionOsSphere");
            item.Property(i => i.PrescriptionOdCylinder).HasColumnName("prescriptionOdCylinder");
            item.Property(i => i.PrescriptionOsCylinder).HasColumnName("prescriptionOsCylinder");
            item.Property(i => i.PrescriptionOdAxis).HasColumnName("prescriptionOdAxis");
            item.Property(i => i.PrescriptionOsAxis).HasColumnName("prescriptionOsAxis");
            item.Property(i => i.PrescriptionPupillaryDistance).HasColumnName("prescriptionPupillaryDistance");
            item.HasOne(i => i.LensType).WithMany().HasForeignKey(i => i.LensTypeId);
            item.HasOne(i => i.LensCoating).WithMany().HasForeignKey(i => i.LensCoatingId);
            item.HasOne(i => i.LensIndex).WithMany().HasForeignKey(i => i.LensIndexId);
        });

        modelBuilder.Entity<AddressRecord>(address =>
        {
            address.ToTable("addresses");
            address.HasKey(a => a.Id);
            address.Property(a => a.Id).HasColumnName("id");
            address.Property(a => a.FullName).HasColumnName("fullName");
            address.Property(a => a.Phone).HasColumnName("phone");
            address.Property(a => a.City).HasColumnName("city");
            address.Property(a => a.District).HasColumnName("district");
            address.Property(a => a.AddressLine).HasColumnName("addressLine");
            address.Property(a => a.Zip).HasColumnName("zip");
        });

        modelBuilder.Entity<PaymentRecord>(payment =>
        {
            payment.ToTable("payments");
            payment.HasKey(p => p.Id);
            payment.Property(p => p.Id).HasColumnName("id");
            payment.Property(p => p.OrderId).HasColumnName("orderId");
            payment.Property(p => p.Status).HasColumnName("status");
        });

        modelBuilder.Entity<LensTypeRecord>(lensType =>
        {
            lensType.ToTable("lens_types");
            lensType.HasKey(t => t.Id);
            lensType.Property(t => t.Id).HasColumnName("id");
            lensType.Property(t => t.Name).HasColumnName("name");
        });

        modelBuilder.Entity<LensCoatingRecord>(lensCoating =>
        {
            lensCoating.ToTable("lens_coatings");
            lensCoating.HasKey(c => c.Id);
            lensCoating.Property(c => c.Id).HasColumnName("id");
            lensCoating.Property(c => c.Name).HasColumnName("name");
        });
    }
}
