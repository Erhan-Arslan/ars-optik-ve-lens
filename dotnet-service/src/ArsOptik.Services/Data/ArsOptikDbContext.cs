using Microsoft.EntityFrameworkCore;

namespace ArsOptik.Services.Data;

/// <summary>
/// Read-only view of the database owned by the NestJS backend. Prisma owns the schema and
/// its migrations; this context never migrates and maps only the columns this service needs.
/// </summary>
public sealed class ArsOptikDbContext(DbContextOptions<ArsOptikDbContext> options) : DbContext(options)
{
    public DbSet<UserRecord> Users => Set<UserRecord>();

    public DbSet<LensIndexRecord> LensIndexes => Set<LensIndexRecord>();

    public DbSet<OrderRecord> Orders => Set<OrderRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ConfigureOrders();

        modelBuilder.Entity<LensIndexRecord>(lensIndex =>
        {
            lensIndex.ToTable("lens_indexes");
            lensIndex.HasKey(li => li.Id);
            lensIndex.Property(li => li.Id).HasColumnName("id");
            lensIndex.Property(li => li.Code).HasColumnName("code");
            lensIndex.Property(li => li.Name).HasColumnName("name");
            lensIndex.Property(li => li.RefractiveIndex).HasColumnName("refractiveIndex");
            lensIndex.Property(li => li.SortOrder).HasColumnName("sortOrder");
        });

        modelBuilder.Entity<UserRecord>(user =>
        {
            user.ToTable("users");
            user.HasKey(u => u.Id);
            user.Property(u => u.Id).HasColumnName("id");
            user.Property(u => u.Email).HasColumnName("email");
            user.Property(u => u.FirstName).HasColumnName("firstName");
            user.Property(u => u.LastName).HasColumnName("lastName");
            user.Property(u => u.Role).HasColumnName("role");
        });
    }
}

public sealed class UserRecord
{
    public required string Id { get; init; }
    public required string Email { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required UserRole Role { get; init; }
}

public sealed class LensIndexRecord
{
    public required string Id { get; init; }
    public required string Code { get; init; }
    public required string Name { get; init; }
    public required decimal RefractiveIndex { get; init; }
    public required int SortOrder { get; init; }
}

/// <summary>Mirrors the Prisma <c>Role</c> Postgres enum (<c>'USER' | 'ADMIN'</c>).</summary>
public enum UserRole
{
    User,
    Admin,
}
