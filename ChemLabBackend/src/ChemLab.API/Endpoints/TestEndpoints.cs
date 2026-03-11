using Microsoft.AspNetCore.SignalR;
using ChemLab.API.Hubs;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ChemLab.API.Endpoints;

public static class TestEndpoints
{
    public static void MapTestEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/test-notification", async (IHubContext<NotificationHub> hubContext, HttpContext httpContext) =>
        {
            var userId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
                return Results.Unauthorized();

            Console.WriteLine($"📨 Enviando notificación de prueba a usuario {userId}");

            await hubContext.Clients.Group($"user-{userId}").SendAsync("ReceiveNotification", new
            {
                Id = Guid.NewGuid().ToString(),
                Title = "🧪 NOTIFICACIÓN DE PRUEBA",
                Message = "¡SignalR funciona correctamente!",
                Type = "test",
                Timestamp = DateTime.UtcNow,
                Read = false
            });

            return Results.Ok(new {
                Message = "Notificación enviada",
                UserId = userId
                // Eliminamos la referencia a ConnectionId que no existe
            });
        }).RequireAuthorization();
    }
}
