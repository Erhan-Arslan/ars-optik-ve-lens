namespace ArsOptik.Services.Prescriptions;

/// <summary>
/// Ophthalmic optics used for the recommendation. Thickness is an estimate: the shop does not
/// store frame measurements yet, so a typical 52□18 frame is assumed.
/// </summary>
public static class LensOptics
{
    public const decimal AssumedPupillaryDistance = 63m;

    // Typical full-rim frame: 52 mm eye size, 18 mm bridge. Effective diameter adds ~2 mm for
    // the longest radius of most shapes.
    private const double FrameLensWidthMm = 52;
    private const double FrameBridgeMm = 18;
    private const double EffectiveDiameterMm = FrameLensWidthMm + 2;

    // Thinnest a lab will surface each material: 1.50 (CR-39) is softer and needs more centre.
    private const double MinusCentreThicknessStandardMm = 2.0;
    private const double MinusCentreThicknessHighIndexMm = 1.5;
    private const double PlusEdgeThicknessMm = 1.0;

    /// <summary>Converts plus-cylinder notation to minus-cylinder (sphere + cyl, −cyl, axis ± 90).</summary>
    public static EyeAnalysis Analyse(decimal sphere, decimal cylinder, int? axis)
    {
        var transposed = cylinder > 0m;
        if (transposed)
        {
            sphere += cylinder;
            cylinder = -cylinder;
            axis = axis is { } a ? (a + 90 - 1) % 180 + 1 : null;
        }

        if (cylinder == 0m)
        {
            axis = null;
        }

        var sphericalEquivalent = sphere + cylinder / 2m;
        // In minus-cylinder form the meridians are sphere and sphere + cylinder.
        var strongest = Math.Abs(sphere + cylinder) > Math.Abs(sphere) ? sphere + cylinder : sphere;

        return new EyeAnalysis(sphere, cylinder, axis, sphericalEquivalent, strongest, transposed);
    }

    /// <summary>
    /// Thickest point of the lens in mm: the edge for minus lenses, the centre for plus lenses.
    /// Uses the sagitta approximation s = y²·|F| / (2000·(n − 1)).
    /// </summary>
    public static double EstimateMaxThicknessMm(decimal strongestPower, decimal refractiveIndex, decimal pupillaryDistance)
    {
        var power = (double)strongestPower;
        var n = (double)refractiveIndex;

        // Optical centres sit at the pupils, so lenses are decentred inward when the wearer's PD
        // is narrower than the frame's; the far edge moves outward by that amount.
        var framePd = FrameLensWidthMm + FrameBridgeMm;
        var decentrationPerEye = Math.Max(0, (framePd - (double)pupillaryDistance) / 2);
        var radius = EffectiveDiameterMm / 2 + decentrationPerEye;

        var sagitta = radius * radius * Math.Abs(power) / (2000 * (n - 1));

        if (power > 0)
        {
            return PlusEdgeThicknessMm + sagitta;
        }

        var centre = n < 1.55 ? MinusCentreThicknessStandardMm : MinusCentreThicknessHighIndexMm;
        return centre + sagitta;
    }
}
