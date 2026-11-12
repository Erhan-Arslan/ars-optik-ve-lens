using System.Globalization;

namespace ArsOptik.Services.Prescriptions;

/// <summary>Turns a validated prescription into per-material thickness estimates and a recommendation.</summary>
public sealed class PrescriptionAnalyzer(ILensIndexCatalog catalog)
{
    /// <summary>Above this the lens starts to look and feel thick in a standard frame.</summary>
    public const double ComfortableThicknessMm = 4.5;

    private const decimal AnisometropiaThreshold = 2m;
    private const decimal HighAstigmatismThreshold = 3m;
    private const decimal HighPowerThreshold = 8m;

    private static readonly CultureInfo Turkish = CultureInfo.GetCultureInfo("tr-TR");

    public async Task<PrescriptionAnalysisResponse> AnalyseAsync(
        PrescriptionAnalysisRequest request, CancellationToken cancellationToken)
    {
        var right = Analyse(request.RightEye!);
        var left = Analyse(request.LeftEye!);
        var pdAssumed = request.PupillaryDistance is null;
        var pd = request.PupillaryDistance ?? LensOptics.AssumedPupillaryDistance;

        var options = await catalog.GetAllAsync(cancellationToken);
        if (options.Count == 0)
        {
            throw new InvalidOperationException("lens_indexes tablosu boş; NestJS seed'i çalıştırılmamış olabilir.");
        }

        var estimates = options
            .Select(option =>
            {
                var rightMm = Round(LensOptics.EstimateMaxThicknessMm(right.StrongestMeridianPower, option.RefractiveIndex, pd));
                var leftMm = Round(LensOptics.EstimateMaxThicknessMm(left.StrongestMeridianPower, option.RefractiveIndex, pd));
                return (option, rightMm, leftMm, maxMm: Math.Max(rightMm, leftMm));
            })
            .ToList();

        // Cheapest material that keeps both lenses comfortable; otherwise the thinnest available.
        var recommended = estimates.FirstOrDefault(e => e.maxMm <= ComfortableThicknessMm);
        if (recommended.option is null)
        {
            recommended = estimates.MinBy(e => e.maxMm);
        }

        return new PrescriptionAnalysisResponse(
            right,
            left,
            pd,
            pdAssumed,
            [.. estimates.Select(e => new LensIndexEstimate(
                e.option.Code, e.option.Name, e.option.RefractiveIndex, e.rightMm, e.leftMm, e.maxMm,
                IsRecommended: e.option.Code == recommended.option.Code))],
            recommended.option.Code,
            ExplainRecommendation(right, left, estimates[0], recommended),
            BuildAdvisories(right, left, pdAssumed));
    }

    private static EyeAnalysis Analyse(EyePrescription eye) =>
        LensOptics.Analyse(eye.Sphere!.Value, eye.Cylinder ?? 0m, eye.Axis);

    private static string ExplainRecommendation(
        EyeAnalysis right,
        EyeAnalysis left,
        (LensIndexOption option, double rightMm, double leftMm, double maxMm) standard,
        (LensIndexOption option, double rightMm, double leftMm, double maxMm) recommended)
    {
        var (eyeLabel, power) = Math.Abs(right.StrongestMeridianPower) >= Math.Abs(left.StrongestMeridianPower)
            ? ("sağ göz", right.StrongestMeridianPower)
            : ("sol göz", left.StrongestMeridianPower);
        var strongest = $"En yüksek numaranız {FormatPower(power)} ({eyeLabel}).";

        if (recommended.option.Code == standard.option.Code)
        {
            return $"{strongest} Standart {standard.option.Code} cam yaklaşık {Mm(standard.maxMm)} kalınlıkta olur; inceltilmiş cama gerek yok.";
        }

        var comfortable = recommended.maxMm <= ComfortableThicknessMm;
        return comfortable
            ? $"{strongest} {recommended.option.Code} cam ile en kalın nokta yaklaşık {Mm(recommended.maxMm)} olur; standart {standard.option.Code} camda bu {Mm(standard.maxMm)} olurdu."
            : $"{strongest} En ince seçenek olan {recommended.option.Code} cam ile en kalın nokta yaklaşık {Mm(recommended.maxMm)}; standart {standard.option.Code} camda bu {Mm(standard.maxMm)} olurdu.";
    }

    private static List<Advisory> BuildAdvisories(EyeAnalysis right, EyeAnalysis left, bool pdAssumed)
    {
        var advisories = new List<Advisory>();

        if (pdAssumed)
        {
            advisories.Add(new Advisory(AdvisoryLevel.Info, "pd-assumed",
                $"PD girilmediği için ortalama {LensOptics.AssumedPupillaryDistance:0} mm varsayıldı. Reçetenizde PD varsa girmeniz kalınlık tahminini iyileştirir."));
        }

        if (right.WasTransposed || left.WasTransposed)
        {
            advisories.Add(new Advisory(AdvisoryLevel.Info, "transposed",
                "Artı silindirli değerler, laboratuvarların kullandığı eksi silindir formuna çevrildi. Bu, reçetenizin anlamını değiştirmez."));
        }

        if (Math.Abs(right.SphericalEquivalent - left.SphericalEquivalent) >= AnisometropiaThreshold)
        {
            advisories.Add(new Advisory(AdvisoryLevel.Warning, "anisometropia",
                "İki gözünüz arasındaki numara farkı 2 diyoptriden fazla. Camlar arasında belirgin kalınlık ve görüntü boyutu farkı olabilir; siparişten önce optisyeninize danışmanızı öneririz."));
        }

        if (Math.Abs(right.Cylinder) >= HighAstigmatismThreshold || Math.Abs(left.Cylinder) >= HighAstigmatismThreshold)
        {
            advisories.Add(new Advisory(AdvisoryLevel.Warning, "high-astigmatism",
                "Astigmat değeriniz yüksek. Aks değerinin reçetenizle birebir aynı girildiğinden emin olun; küçük bir aks hatası görüşü belirgin etkiler."));
        }

        if (Math.Abs(right.StrongestMeridianPower) > HighPowerThreshold || Math.Abs(left.StrongestMeridianPower) > HighPowerThreshold)
        {
            advisories.Add(new Advisory(AdvisoryLevel.Warning, "high-power",
                "Numaranız yüksek. Bu tahmin standart bir çerçeveye göre yapıldı; küçük ve yuvarlak çerçeveler camı belirgin şekilde inceltir."));
        }

        return advisories;
    }

    private static double Round(double mm) => Math.Round(mm, 1, MidpointRounding.AwayFromZero);

    private static string Mm(double mm) => $"{mm.ToString("0.0", Turkish)} mm";

    private static string FormatPower(decimal power) =>
        (power > 0 ? "+" : "") + power.ToString("0.00", Turkish) + " D";
}
