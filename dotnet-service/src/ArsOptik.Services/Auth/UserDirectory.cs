using ArsOptik.Services.Data;
using Microsoft.EntityFrameworkCore;

namespace ArsOptik.Services.Auth;

public sealed record AppUser(string Id, string Email, string FirstName, string LastName, UserRole Role);

/// <summary>Looks up the user behind a token; separated from EF Core so tests can stub it.</summary>
public interface IUserDirectory
{
    Task<AppUser?> FindAsync(string userId, CancellationToken cancellationToken);
}

public sealed class EfUserDirectory(ArsOptikDbContext db) : IUserDirectory
{
    public Task<AppUser?> FindAsync(string userId, CancellationToken cancellationToken) =>
        db.Users
            .Where(u => u.Id == userId)
            .Select(u => new AppUser(u.Id, u.Email, u.FirstName, u.LastName, u.Role))
            .SingleOrDefaultAsync(cancellationToken);
}
