using ArsOptik.Services.Prescriptions;

namespace ArsOptik.Services.Tests;

public sealed class LensOpticsTests
{
    [Fact]
    public void Transposes_plus_cylinder_to_minus_cylinder_form()
    {
        // +1.00 / +2.00 × 90  ≡  +3.00 / −2.00 × 180
        var eye = LensOptics.Analyse(1.00m, 2.00m, 90);

        Assert.Equal((3.00m, -2.00m, 180), (eye.Sphere, eye.Cylinder, eye.Axis));
        Assert.True(eye.WasTransposed);
    }

    [Theory]
    [InlineData(45, 135)]
    [InlineData(100, 10)]
    [InlineData(180, 90)]
    public void Transposition_rotates_axis_by_90_within_1_to_180(int axis, int expected) =>
        Assert.Equal(expected, LensOptics.Analyse(-1m, 1m, axis).Axis);

    [Fact]
    public void Computes_spherical_equivalent_and_strongest_meridian()
    {
        var eye = LensOptics.Analyse(-2.00m, -1.50m, 170);

        Assert.Equal(-2.75m, eye.SphericalEquivalent);
        Assert.Equal(-3.50m, eye.StrongestMeridianPower);
        Assert.False(eye.WasTransposed);
    }

    [Fact]
    public void Drops_axis_when_there_is_no_cylinder()
    {
        Assert.Null(LensOptics.Analyse(-1m, 0m, 90).Axis);
    }

    [Fact]
    public void Higher_index_material_is_thinner_for_the_same_power()
    {
        decimal[] indexes = [1.50m, 1.60m, 1.67m, 1.74m];

        var thicknesses = indexes.Select(n => LensOptics.EstimateMaxThicknessMm(-6m, n, 63m)).ToList();

        Assert.Equal(thicknesses.OrderDescending(), thicknesses);
    }

    [Fact]
    public void Narrow_pupillary_distance_thickens_minus_lenses()
    {
        var narrow = LensOptics.EstimateMaxThicknessMm(-4m, 1.6m, 56m);
        var wide = LensOptics.EstimateMaxThicknessMm(-4m, 1.6m, 70m);

        Assert.True(narrow > wide);
    }

    [Fact]
    public void Plano_lens_is_only_minimum_centre_thickness() =>
        Assert.Equal(2.0, LensOptics.EstimateMaxThicknessMm(0m, 1.5m, 63m));
}
