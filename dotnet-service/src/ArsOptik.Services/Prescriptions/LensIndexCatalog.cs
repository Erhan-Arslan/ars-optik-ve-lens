using ArsOptik.Services.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace ArsOptik.Services.Prescriptions;

public sealed record LensIndexOption(string Code, string Name, decimal RefractiveIndex);

/// <summary>The lens materials on sale, ordered from standard to thinnest.</summary>
public interface ILensIndexCatalog
{
    Task<IReadOnlyList<LensIndexOption>> GetAllAsync(CancellationToken cancellationToken);
}

/// <summary>
/// Reads the NestJS-owned lens_indexes table. The list changes only on seed/admin edits, so it is
/// cached briefly to spare the (scale-to-zero) database a query per keystroke.
/// </summary>
public sealed class EfLensIndexCatalog(ArsOptikDbContext db, IMemoryCache cache) : ILensIndexCatalog
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(10);

    public async Task<IReadOnlyList<LensIndexOption>> GetAllAsync(CancellationToken cancellationToken) =>
        await cache.GetOrCreateAsync(nameof(EfLensIndexCatalog), async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheDuration;
            return (IReadOnlyList<LensIndexOption>)await db.LensIndexes
                .OrderBy(li => li.SortOrder)
                .Select(li => new LensIndexOption(li.Code, li.Name, li.RefractiveIndex))
                .ToListAsync(cancellationToken);
        }) ?? [];
}
