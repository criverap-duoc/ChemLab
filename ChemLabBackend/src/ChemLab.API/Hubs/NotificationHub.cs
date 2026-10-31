using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ChemLab.API.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine($"🔌 Intento de conexión - UserId: {userId ?? "null"}");

        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
            Console.WriteLine($"✅ Usuario {userId} agregado al grupo user-{userId}");

            if (Context.User?.IsInRole("ADMIN") == true)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "admins");
                Console.WriteLine($"👑 Admin {userId} agregado al grupo admins");
            }
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Console.WriteLine($"❌ Usuario {userId ?? "desconocido"} desconectado");
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// F7c: el frontend invoca "MarkAsRead" desde notificationService.markAsRead().
    /// La persistencia en BD ya la hace POST /api/notifications/mark-read/{id}; aquí
    /// solo se confirma al llamador para que actualice su estado local.
    /// </summary>
    public async Task MarkAsRead(string notificationId)
    {
        await Clients.Caller.SendAsync("NotificationRead", notificationId);
    }
}
