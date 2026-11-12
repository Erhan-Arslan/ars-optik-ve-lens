namespace ArsOptik.Services.Prescriptions;

/// <summary>One eye as written on a prescription. Powers are in dioptres, axis in degrees.</summary>
public sealed record EyePrescription(decimal? Sphere, decimal? Cylinder, int? Axis);

public sealed record PrescriptionAnalysisRequest(
    EyePrescription? RightEye,
    EyePrescription? LeftEye,
    decimal? PupillaryDistance);

public sealed record PrescriptionAnalysisResponse(
    EyeAnalysis RightEye,
    EyeAnalysis LeftEye,
    decimal PupillaryDistance,
    bool PupillaryDistanceAssumed,
    IReadOnlyList<LensIndexEstimate> LensIndexes,
    string RecommendedLensIndexCode,
    string RecommendationReason,
    IReadOnlyList<Advisory> Advisories);

/// <summary>An eye normalised to minus-cylinder form, the convention lens labs work in.</summary>
public sealed record EyeAnalysis(
    decimal Sphere,
    decimal Cylinder,
    int? Axis,
    decimal SphericalEquivalent,
    decimal StrongestMeridianPower,
    bool WasTransposed);

public sealed record LensIndexEstimate(
    string Code,
    string Name,
    decimal RefractiveIndex,
    double RightEyeThicknessMm,
    double LeftEyeThicknessMm,
    double MaxThicknessMm,
    bool IsRecommended);

public enum AdvisoryLevel
{
    Info,
    Warning,
}

public sealed record Advisory(AdvisoryLevel Level, string Code, string Message);
