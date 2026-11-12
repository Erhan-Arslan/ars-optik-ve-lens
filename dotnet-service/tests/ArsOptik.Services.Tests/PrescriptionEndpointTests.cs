using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using ArsOptik.Services.Prescriptions;
using Microsoft.AspNetCore.Mvc;

namespace ArsOptik.Services.Tests;

public sealed class PrescriptionEndpointTests(ServiceFactory factory) : IClassFixture<ServiceFactory>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    private async Task<PrescriptionAnalysisResponse> AnalyseAsync(object body)
    {
        var response = await factory.CreateClient().PostAsJsonAsync("/prescriptions/analyze", body, Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<PrescriptionAnalysisResponse>(Json, Ct))!;
    }

    private static object Symmetric(decimal sphere) => new
    {
        rightEye = new { sphere },
        leftEye = new { sphere },
        pupillaryDistance = 63m,
    };

    [Theory]
    [InlineData(-1.00, "1.50")]
    [InlineData(-2.50, "1.50")]
    [InlineData(-3.00, "1.60")]
    [InlineData(-4.00, "1.67")]
    [InlineData(-6.00, "1.74")]
    [InlineData(4.00, "1.60")]
    public async Task Recommends_the_cheapest_comfortable_index(double sphere, string expected)
    {
        var analysis = await AnalyseAsync(Symmetric((decimal)sphere));

        Assert.Equal(expected, analysis.RecommendedLensIndexCode);
        Assert.Single(analysis.LensIndexes, li => li.IsRecommended);
        Assert.Equal(expected, analysis.LensIndexes.Single(li => li.IsRecommended).Code);
    }

    [Fact]
    public async Task Returns_an_estimate_per_index_thinning_with_higher_index()
    {
        var analysis = await AnalyseAsync(Symmetric(-5m));

        Assert.Equal(["1.50", "1.60", "1.67", "1.74"], analysis.LensIndexes.Select(li => li.Code));
        Assert.Equal(analysis.LensIndexes.Select(li => li.MaxThicknessMm).OrderDescending(),
            analysis.LensIndexes.Select(li => li.MaxThicknessMm));
        Assert.Contains("-5,00 D", analysis.RecommendationReason);
    }

    [Fact]
    public async Task Normalises_plus_cylinder_and_flags_it()
    {
        var analysis = await AnalyseAsync(new
        {
            rightEye = new { sphere = 1.00m, cylinder = 2.00m, axis = 90 },
            leftEye = new { sphere = 1.00m },
            pupillaryDistance = 63m,
        });

        Assert.Equal((3.00m, -2.00m, 180), (analysis.RightEye.Sphere, analysis.RightEye.Cylinder, analysis.RightEye.Axis));
        Assert.Contains(analysis.Advisories, a => a.Code == "transposed");
    }

    [Fact]
    public async Task Assumes_average_pd_when_missing()
    {
        var analysis = await AnalyseAsync(new { rightEye = new { sphere = -1m }, leftEye = new { sphere = -1m } });

        Assert.True(analysis.PupillaryDistanceAssumed);
        Assert.Equal(LensOptics.AssumedPupillaryDistance, analysis.PupillaryDistance);
        Assert.Contains(analysis.Advisories, a => a is { Code: "pd-assumed", Level: AdvisoryLevel.Info });
    }

    [Fact]
    public async Task Warns_about_large_difference_between_eyes()
    {
        var analysis = await AnalyseAsync(new
        {
            rightEye = new { sphere = -1m },
            leftEye = new { sphere = -3.5m },
            pupillaryDistance = 63m,
        });

        Assert.Contains(analysis.Advisories, a => a is { Code: "anisometropia", Level: AdvisoryLevel.Warning });
    }

    [Fact]
    public async Task Returns_field_errors_for_an_invalid_prescription()
    {
        var response = await factory.CreateClient().PostAsJsonAsync("/prescriptions/analyze", new
        {
            rightEye = new { sphere = -1.3m },
            leftEye = new { sphere = -1m, cylinder = -1m },
        }, Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>(Ct);
        Assert.Equal(["leftEye.axis", "rightEye.sphere"], problem!.Errors.Keys.Order(StringComparer.Ordinal));
    }
}
