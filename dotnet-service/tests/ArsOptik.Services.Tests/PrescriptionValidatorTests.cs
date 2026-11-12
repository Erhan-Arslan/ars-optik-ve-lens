using ArsOptik.Services.Prescriptions;

namespace ArsOptik.Services.Tests;

public sealed class PrescriptionValidatorTests
{
    private static PrescriptionAnalysisRequest Request(
        EyePrescription? right = null, EyePrescription? left = null, decimal? pd = null) =>
        new(right ?? new(-1.00m, null, null), left ?? new(-1.25m, null, null), pd);

    [Fact]
    public void Accepts_a_typical_prescription() =>
        Assert.Empty(PrescriptionValidator.Validate(Request(new(-2.25m, -0.75m, 180), new(-2.00m, -0.50m, 5), 63.5m)));

    [Fact]
    public void Requires_sphere_for_both_eyes()
    {
        var errors = PrescriptionValidator.Validate(new PrescriptionAnalysisRequest(null, new(null, null, null), null));

        Assert.Contains("rightEye.sphere", errors.Keys);
        Assert.Contains("leftEye.sphere", errors.Keys);
    }

    [Theory]
    [InlineData(-1.30)]
    [InlineData(20.25)]
    [InlineData(-21)]
    public void Rejects_sphere_off_step_or_out_of_range(double sphere) =>
        Assert.Contains("rightEye.sphere", PrescriptionValidator.Validate(Request(right: new((decimal)sphere, null, null))).Keys);

    [Theory]
    [InlineData(-0.30)]
    [InlineData(6.25)]
    public void Rejects_cylinder_off_step_or_out_of_range(double cylinder) =>
        Assert.Contains("rightEye.cylinder", PrescriptionValidator.Validate(Request(right: new(-1m, (decimal)cylinder, 90))).Keys);

    [Fact]
    public void Requires_axis_when_cylinder_is_given() =>
        Assert.Contains("leftEye.axis", PrescriptionValidator.Validate(Request(left: new(-1m, -1.25m, null))).Keys);

    [Theory]
    [InlineData(0)]
    [InlineData(181)]
    public void Rejects_axis_outside_1_to_180(int axis) =>
        Assert.Contains("rightEye.axis", PrescriptionValidator.Validate(Request(right: new(-1m, -1m, axis))).Keys);

    [Theory]
    [InlineData(49.5)]
    [InlineData(63.3)]
    [InlineData(80.5)]
    public void Rejects_invalid_pupillary_distance(double pd) =>
        Assert.Contains("pupillaryDistance", PrescriptionValidator.Validate(Request(pd: (decimal)pd)).Keys);
}
