using QuestPDF.Drawing;
using QuestPDF.Infrastructure;

namespace ArsOptik.Services.Invoices;

/// <summary>
/// Brand fonts (Fraunces, Manrope — SIL OFL, see Assets/Fonts) and the logo, embedded in the
/// assembly: the distroless runtime image has no system fonts.
/// </summary>
public static class InvoiceAssets
{
    public const string DisplayFont = "Fraunces";
    public const string BodyFont = "Manrope";

    private static readonly Lazy<byte[]> LogoBytes = new(() => ReadResource("logo.png"));
    private static readonly Lazy<bool> Initialised = new(Initialise);

    public static byte[] Logo => LogoBytes.Value;

    /// <summary>Configures QuestPDF and registers the fonts; safe to call from every request.</summary>
    public static void EnsureInitialised() => _ = Initialised.Value;

    private static bool Initialise()
    {
        // Free for organisations under USD 1M annual revenue: https://www.questpdf.com/license/
        QuestPDF.Settings.License = LicenseType.Community;
        QuestPDF.Settings.UseSystemFonts = false;
        // Fail loudly instead of printing boxes if a character (e.g. ş, ₺) is missing from the fonts.
        QuestPDF.Settings.ThrowOnMissingTextGlyphs = true;

        // QuestPDF resolves fonts by the family name stored in each file, then picks the weight.
        foreach (var fileName in new[] { "Fraunces-SemiBold.ttf", "Manrope-Regular.ttf", "Manrope-SemiBold.ttf", "Manrope-Bold.ttf" })
        {
            using var stream = OpenResource(fileName);
            FontManager.RegisterFontFromStream(stream);
        }
        return true;
    }

    private static byte[] ReadResource(string fileName)
    {
        using var stream = OpenResource(fileName);
        using var memory = new MemoryStream();
        stream.CopyTo(memory);
        return memory.ToArray();
    }

    private static Stream OpenResource(string fileName) =>
        typeof(InvoiceAssets).Assembly.GetManifestResourceStream($"Invoices.{fileName}")
        ?? throw new InvalidOperationException($"Gömülü kaynak bulunamadı: {fileName}");
}
