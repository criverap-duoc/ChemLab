using ChemLab.Domain.Entities;
using ChemLab.Domain.Enums;
using ChemLab.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using ChemLab.API.Hubs;

namespace ChemLab.API.Services;

public class NotificationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<NotificationBackgroundService> _logger;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationBackgroundService(
        IServiceProvider services,
        ILogger<NotificationBackgroundService> logger,
        IHubContext<NotificationHub> hubContext)
    {
        _services = services;
        _logger = logger;
        _hubContext = hubContext;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🚀 Servicio de notificaciones contextuales iniciado");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                await CheckLowStock(context);
                await CheckUpcomingCalibrations(context, notificationService);
                await CheckPendingRequests(context);
                await CheckExpiringReagents(context);

                // Esperar 6 horas antes de la próxima verificación
                await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en servicio de notificaciones");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }
    }

    private async Task CheckLowStock(ApplicationDbContext context)
    {
        var lowStockReagents = await context.Reagents
            .Include(r => r.CreatedBy)
            .Where(r => r.IsActive && r.Quantity <= r.MinQuantity)
            .ToListAsync();

        foreach (var reagent in lowStockReagents)
        {
            // Notificar a admins
            var admins = await GetAdminUsers(context);
            foreach (var admin in admins)
            {
                await SendNotification(
                    admin.Id,
                    "⚠️ Stock Bajo",
                    $"El reactivo '{reagent.Name}' tiene stock bajo ({reagent.Quantity} {reagent.Unit})",
                    "low_stock",
                    new { reagentId = reagent.Id }
                );
            }

            // Notificar al creador
            await SendNotification(
                reagent.CreatedById,
                "⚠️ Stock Bajo en tu reactivo",
                $"Tu reactivo '{reagent.Name}' tiene stock bajo ({reagent.Quantity} {reagent.Unit})",
                "low_stock_creator",
                new { reagentId = reagent.Id }
            );
        }
    }

    private async Task CheckUpcomingCalibrations(ApplicationDbContext context, INotificationService notificationService)
    {
        var equipment = await context.Equipment
            .Include(e => e.CreatedBy)
            .Where(e => e.IsActive && e.NextCalibration.HasValue)
            .ToListAsync();

        Console.WriteLine($"🔧 Verificando calibraciones: {equipment.Count} equipos");

        foreach (var item in equipment)
        {
            // Reutiliza el INotificationService del scope actual (antes creaba un scope por equipo sin liberarlo)
            await notificationService.NotifyCalibrationDue(item);
        }
    }

    private async Task CheckPendingRequests(ApplicationDbContext context)
    {
        var pendingRequests = await context.Requests
            .Include(r => r.RequestedBy)
            .Where(r => r.Status == RequestStatus.Pending)
            .ToListAsync();

        if (pendingRequests.Count == 0)
            return;

        // Notificar una sola vez por iteración (antes enviaba un aviso por cada solicitud pendiente)
        var admins = await GetAdminUsers(context);
        foreach (var admin in admins)
        {
            await SendNotification(
                admin.Id,
                "📝 Solicitudes Pendientes",
                $"Hay {pendingRequests.Count} solicitud(es) pendiente(s) de revisión",
                "pending_requests",
                null
            );
        }
    }

    private async Task CheckExpiringReagents(ApplicationDbContext context)
    {
        var today = DateTime.UtcNow;
        var expiringSoon = await context.Reagents
            .Include(r => r.CreatedBy)
            .Where(r => r.IsActive && r.ExpiryDate.HasValue)
            .ToListAsync();

        foreach (var reagent in expiringSoon)
        {
            var daysUntil = (reagent.ExpiryDate!.Value - today).Days;

            // Reactivo próximo a vencer (≤ 30 días)
            if (daysUntil >= 0 && daysUntil <= 30)
            {
                string urgency = daysUntil <= 7 ? "URGENTE" : "próximo";

                await SendNotification(
                    reagent.CreatedById,
                    daysUntil <= 7 ? "🔴 Reactivo por VENCER" : "🟡 Reactivo próximo a vencer",
                    $"El reactivo '{reagent.Name}' vence en {daysUntil} días",
                    "reagent_expiring",
                    new { reagentId = reagent.Id, daysUntil }
                );
            }

            // Reactivo vencido
            if (daysUntil < 0)
            {
                var daysOverdue = Math.Abs(daysUntil);

                await SendNotification(
                    reagent.CreatedById,
                    "⚠️ Reactivo VENCIDO",
                    $"El reactivo '{reagent.Name}' lleva {daysOverdue} días vencido",
                    "reagent_expired",
                    new { reagentId = reagent.Id, daysOverdue }
                );
            }
        }
    }

    private async Task<List<User>> GetAdminUsers(ApplicationDbContext context)
    {
        return await context.Users
            .Where(u => u.IsActive && context.UserRoles
                .Any(ur => ur.UserId == u.Id && context.Roles
                    .Where(r => r.Name == "ADMIN")
                    .Select(r => r.Id)
                    .Contains(ur.RoleId)))
            .ToListAsync();
    }

    private async Task SendNotification(Guid userId, string title, string message, string type, object? data)
    {
        try
        {
            await _hubContext.Clients.Group($"user-{userId}").SendAsync("ReceiveNotification", new
            {
                Id = Guid.NewGuid().ToString(),
                Title = title,
                Message = message,
                Type = type,
                Timestamp = DateTime.UtcNow,
                Read = false,
                Data = data
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error enviando notificación a usuario {userId}");
        }
    }
}
