namespace ArsOptik.Services.Prescriptions;

/// <summary>
/// Same limits the NestJS order endpoint enforces, so a prescription that analyses cleanly
/// here is also accepted at checkout. Errors are keyed by JSON path for the form to highlight.
/// </summary>
public static class PrescriptionValidator
{
    public const decimal MaxSphere = 20m;
    public const decimal MaxCylinder = 6m;
    public const decimal PowerStep = 0.25m;
    public const decimal MinPupillaryDistance = 50m;
    public const decimal MaxPupillaryDistance = 80m;
    public const decimal PupillaryDistanceStep = 0.5m;

    public static Dictionary<string, string[]> Validate(PrescriptionAnalysisRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        ValidateEye(request.RightEye, "rightEye", "Sağ göz", errors);
        ValidateEye(request.LeftEye, "leftEye", "Sol göz", errors);

        if (request.PupillaryDistance is { } pd
            && (pd < MinPupillaryDistance || pd > MaxPupillaryDistance || !IsStep(pd, PupillaryDistanceStep)))
        {
            errors["pupillaryDistance"] =
                [$"PD {MinPupillaryDistance:0}–{MaxPupillaryDistance:0} mm arasında ve 0.5 mm adımlarla olmalı."];
        }

        return errors;
    }

    private static void ValidateEye(EyePrescription? eye, string path, string label, Dictionary<string, string[]> errors)
    {
        if (eye?.Sphere is not { } sphere)
        {
            errors[$"{path}.sphere"] = [$"{label} için sferik (SPH) değeri gerekli."];
        }
        else if (Math.Abs(sphere) > MaxSphere || !IsStep(sphere, PowerStep))
        {
            errors[$"{path}.sphere"] = [$"{label} SPH ±{MaxSphere:0.00} aralığında ve 0.25 adımlarla olmalı."];
        }

        var cylinder = eye?.Cylinder ?? 0m;
        if (Math.Abs(cylinder) > MaxCylinder || !IsStep(cylinder, PowerStep))
        {
            errors[$"{path}.cylinder"] = [$"{label} CYL ±{MaxCylinder:0.00} aralığında ve 0.25 adımlarla olmalı."];
        }

        if (eye?.Axis is { } axis && axis is < 1 or > 180)
        {
            errors[$"{path}.axis"] = [$"{label} AKS 1–180 derece arasında olmalı."];
        }
        else if (cylinder != 0m && eye?.Axis is null)
        {
            errors[$"{path}.axis"] = [$"{label} için silindir girildiğinde aks (AKS) da gerekli."];
        }
    }

    private static bool IsStep(decimal value, decimal step) => value % step == 0m;
}
