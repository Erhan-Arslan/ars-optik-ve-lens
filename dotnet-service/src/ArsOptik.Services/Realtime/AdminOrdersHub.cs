using ArsOptik.Services.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ArsOptik.Services.Realtime;

/// <summary>Methods the admin panel listens for.</summary>
public interface IAdminOrdersClient
{
    Task OrderEvent(OrderEvent orderEvent);
}

/// <summary>
/// Server-to-client only: admins connect to receive order events and send nothing back.
/// Only admins may connect, so broadcasting to all clients reaches exactly the admins.
/// </summary>
[Authorize(Policy = AuthenticationSetup.AdminPolicy)]
public sealed class AdminOrdersHub : Hub<IAdminOrdersClient>
{
    public const string Path = "/hubs/admin-orders";
}
