using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using ArsOptik.Services.Auth;
using ArsOptik.Services.Data;
using ArsOptik.Services.Invoices;
using ArsOptik.Services.Notifications;
using ArsOptik.Services.Prescriptions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace ArsOptik.Services.Tests;

/// <summary>Hosts the service in memory with a stubbed user table instead of PostgreSQL.</summary>
public sealed class ServiceFactory : WebApplicationFactory<Program>
{
    public const string Secret = "test-only-access-secret-at-least-32-bytes";
    public const string InternalApiKey = "test-only-internal-api-key-32-bytes-min";

    public static readonly AppUser Customer = new("user-1", "musteri@arsoptik.com", "Ayşe", "Yılmaz", UserRole.User);
    public static readonly AppUser Admin = new("admin-1", "admin@arsoptik.com", "Admin", "Kullanıcı", UserRole.Admin);
    public static readonly AppUser OtherCustomer = new("user-2", "baska@arsoptik.com", "Mehmet", "Demir", UserRole.User);

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("JWT_ACCESS_SECRET", Secret);
        builder.UseSetting("DATABASE_URL", "postgresql://unused:unused@localhost/unused");
        builder.UseSetting("INTERNAL_API_KEY", InternalApiKey);
        builder.ConfigureServices(services =>
        {
            services.Replace(ServiceDescriptor.Scoped<IUserDirectory>(_ => new StubUserDirectory([Customer, Admin, OtherCustomer])));
            services.Replace(ServiceDescriptor.Scoped<ILensIndexCatalog>(_ => new StubLensIndexCatalog()));
            services.Replace(ServiceDescriptor.Scoped<IInvoiceDataSource>(_ => new StubInvoiceDataSource()));
            services.Replace(ServiceDescriptor.Singleton<IEmailSender>(Emails));
        });
    }

    /// <summary>Captures the e-mails the background worker would send.</summary>
    public RecordingEmailSender Emails { get; } = new();

    public HttpClient CreateClientWithToken(string token)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    /// <summary>Mints a token shaped like the NestJS backend's: HS256 with only sub and email.</summary>
    public static string CreateToken(string userId, string email, string secret = Secret, TimeSpan? expiresIn = null)
    {
        var now = DateTime.UtcNow;
        var expires = now + (expiresIn ?? TimeSpan.FromMinutes(15));
        return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity([new Claim("sub", userId), new Claim("email", email)]),
            IssuedAt = expires < now ? expires.AddMinutes(-15) : now,
            NotBefore = expires < now ? expires.AddMinutes(-15) : now,
            Expires = expires,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)), SecurityAlgorithms.HmacSha256),
        });
    }

    /// <summary>A prescription order with Turkish text, owned by <see cref="Customer"/>.</summary>
    public static readonly InvoiceData SampleInvoice = new(
        "ARS123456",
        new DateTimeOffset(2026, 11, 12, 12, 30, 0, TimeSpan.Zero),
        "Hazırlanıyor",
        "Ödendi",
        new InvoiceCustomer("Ayşe Yılmaz", Customer.Email),
        new InvoiceAddress("Ayşe Yılmaz", "05551234567", "Şehit Öğretmen Sk. No:3 Daire 5", "Üsküdar", "İstanbul", "34664"),
        [
            new InvoiceLine("Leo Yuvarlak Çerçeve", ["Renk: Antik Altın", "Tek Odak", "Mavi Işık Filtresi", "Ultra İnce (1.74)"], 1, 6250m,
                new InvoicePrescription(new InvoiceEye("-4.25", -0.75m, 180), new InvoiceEye("-3.75", null, null), 62m)),
            new InvoiceLine("Günlük Tek Kullanımlık Lens (30'lu Kutu)", ["Renk: Şeffaf"], 2, 1250m, null),
        ],
        8750m,
        0m,
        8750m);

    private sealed class StubInvoiceDataSource : IInvoiceDataSource
    {
        public Task<InvoiceSource?> FindAsync(string orderNumber, CancellationToken cancellationToken) =>
            Task.FromResult(orderNumber == SampleInvoice.OrderNumber ? new InvoiceSource(Customer.Id, SampleInvoice) : null);
    }

    /// <summary>Same rows as the NestJS seed.</summary>
    private sealed class StubLensIndexCatalog : ILensIndexCatalog
    {
        public Task<IReadOnlyList<LensIndexOption>> GetAllAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<LensIndexOption>>(
            [
                new("1.50", "Standart (1.50)", 1.50m),
                new("1.60", "İnceltilmiş (1.60)", 1.60m),
                new("1.67", "Ekstra İnce (1.67)", 1.67m),
                new("1.74", "Ultra İnce (1.74)", 1.74m),
            ]);
    }

    private sealed class StubUserDirectory(IReadOnlyList<AppUser> users) : IUserDirectory
    {
        public Task<AppUser?> FindAsync(string userId, CancellationToken cancellationToken) =>
            Task.FromResult(users.FirstOrDefault(u => u.Id == userId));
    }
}
