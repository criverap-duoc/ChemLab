using Microsoft.AspNetCore.SignalR;
using ChemLab.API.Hubs;
using ChemLab.Domain.Entities;
using ChemLab.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ChemLab.API.Services;

public interface INotificationService
{
    Task NotifyNewRequest(Request request);
    Task NotifyRequestStatusChanged(Request request);
    Task NotifyLowStock(Reagent reagent);
    Task NotifyCalibrationDue(Equipment equipment);
    Task NotifyExperimentStatusChanged(Experiment experiment);
    Task TestNotification(string userId);
}

public class NotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IHubContext<NotificationHub> hubContext,
        ApplicationDbContext context,
        ILogger<NotificationService> logger)
    {
        _hubContext = hubContext;
        _context = context;
        _logger = logger;
    }

    private async Task SaveNotification(Guid userId, string title, string message, string type, object? data = null)
    {
        try
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                Title = title,
                Message = message,
                Type = type,
                Timestamp = DateTime.UtcNow,
                IsRead = false,
                UserId = userId,
                Data = data != null ? JsonSerializer.Serialize(data) : null
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error guardando notificación para usuario {userId}");
        }
    }

    public async Task NotifyNewRequest(Request request)
    {
        try
        {
            var title = "📝 Nueva Solicitud";
            var message = $"Se ha creado una nueva solicitud: {request.Title}";

            _logger.LogInformation($"Enviando notificación de nueva solicitud {request.Id}");

            var admins = await GetAdminUsers();
            foreach (var admin in admins)
            {
                await _hubContext.Clients.Group($"user-{admin.Id}").SendAsync("ReceiveNotification", new
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = title,
                    Message = message,
                    Type = "request_new",
                    Timestamp = DateTime.UtcNow,
                    Read = false,
                    Data = new { requestId = request.Id }
                });

                await SaveNotification(admin.Id, title, message, "request_new", new { requestId = request.Id });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enviando notificación de nueva solicitud");
        }
    }

    public async Task NotifyRequestStatusChanged(Request request)
    {
        try
        {
            string title;
            string type;

            switch (request.Status)
            {
                case RequestStatus.Approved:
                    title = "✅ Solicitud Aprobada";
                    type = "request_approved";
                    break;
                case RequestStatus.Rejected:
                    title = "❌ Solicitud Rechazada";
                    type = "request_rejected";
                    break;
                default:
                    return;
            }

            var message = $"Tu solicitud '{request.Title}' ha sido {request.Status.ToString().ToLower()}";

            _logger.LogInformation($"Enviando notificación de cambio de estado a usuario {request.RequestedById}");

            await _hubContext.Clients.Group($"user-{request.RequestedById}").SendAsync("ReceiveNotification", new
            {
                Id = Guid.NewGuid().ToString(),
                Title = title,
                Message = message,
                Type = type,
                Timestamp = DateTime.UtcNow,
                Read = false,
                Data = new { requestId = request.Id }
            });

            await SaveNotification(request.RequestedById, title, message, type, new { requestId = request.Id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enviando notificación de cambio de estado");
        }
    }

    public async Task NotifyLowStock(Reagent reagent)
    {
        Console.WriteLine("========== NOTIFY LOW STOCK ==========");
        Console.WriteLine($"🔔 INICIANDO NOTIFICACIÓN para {reagent.Name}");

        var title = "⚠️ Stock Bajo";
        var message = $"El reactivo '{reagent.Name}' tiene stock bajo ({reagent.Quantity} {reagent.Unit})";

        // 1. Notificar a todos los admins
        var admins = await GetAdminUsers();
        Console.WriteLine($"👥 Admins encontrados: {admins.Count}");

        foreach (var admin in admins)
        {
            Console.WriteLine($"📨 Enviando a admin {admin.Email} (ID: {admin.Id})");
            Console.WriteLine($"   - Grupo: user-{admin.Id}");

            try
            {
                await _hubContext.Clients.Group($"user-{admin.Id}").SendAsync("ReceiveNotification", new
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = title,
                    Message = message,
                    Type = "low_stock",
                    Timestamp = DateTime.UtcNow,
                    Read = false,
                    Data = new { reagentId = reagent.Id }
                });

                await SaveNotification(admin.Id, title, message, "low_stock", new { reagentId = reagent.Id });
                Console.WriteLine($"✅ Notificación enviada a admin {admin.Email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error enviando a admin {admin.Email}: {ex.Message}");
            }
        }

        // 2. También notificar al creador del reactivo
        var creator = await _context.Users.FindAsync(reagent.CreatedById);
        if (creator != null && creator.IsActive)
        {
            var creatorTitle = "⚠️ Stock Bajo en tu reactivo";
            var creatorMessage = $"Tu reactivo '{reagent.Name}' tiene stock bajo ({reagent.Quantity} {reagent.Unit})";

            Console.WriteLine($"📨 Enviando también al creador {creator.Email}");
            try
            {
                await _hubContext.Clients.Group($"user-{creator.Id}").SendAsync("ReceiveNotification", new
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = creatorTitle,
                    Message = creatorMessage,
                    Type = "low_stock_creator",
                    Timestamp = DateTime.UtcNow,
                    Read = false,
                    Data = new { reagentId = reagent.Id }
                });

                await SaveNotification(creator.Id, creatorTitle, creatorMessage, "low_stock_creator", new { reagentId = reagent.Id });
                Console.WriteLine($"✅ Notificación enviada al creador {creator.Email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error enviando al creador {creator.Email}: {ex.Message}");
            }
        }

        Console.WriteLine("========================================");
    }

    public async Task NotifyCalibrationDue(Equipment equipment)
    {
        try
        {
            var today = DateTime.UtcNow;

            if (!equipment.NextCalibration.HasValue)
                return;

            var daysUntil = (equipment.NextCalibration.Value - today).Days;

            string title;
            string message;
            string type;

            // Determinar el tipo de notificación
            if (daysUntil < 0)
            {
                // Calibración vencida
                var daysOverdue = Math.Abs(daysUntil);
                title = daysOverdue <= 7 ? "🔴 Calibración VENCIDA" : "⚠️ Calibración Vencida";
                message = $"El equipo '{equipment.Name}' lleva {daysOverdue} días sin calibrar";
                type = "calibration_overdue";
            }
            else if (daysUntil <= 3)
            {
                // Calibración URGENTE (≤ 3 días)
                title = "🔴 Calibración URGENTE";
                message = $"El equipo '{equipment.Name}' requiere calibración URGENTE en {daysUntil} días";
                type = "calibration_urgent";
            }
            else if (daysUntil <= 7)
            {
                // Calibración próxima (4-7 días)
                title = "🟡 Calibración próxima";
                message = $"El equipo '{equipment.Name}' requiere calibración en {daysUntil} días";
                type = "calibration_upcoming";
            }
            else if (daysUntil <= 30)
            {
                // Calibración programada (8-30 días) - solo para admins
                title = "📅 Calibración programada";
                message = $"El equipo '{equipment.Name}' requiere calibración en {daysUntil} días";
                type = "calibration_scheduled";
            }
            else
            {
                return; // No notificar si falta más de un mes
            }

            Console.WriteLine($"========== NOTIFY CALIBRATION ==========");
            Console.WriteLine($"🔧 Equipo: {equipment.Name}");
            Console.WriteLine($"📅 Días hasta calibración: {daysUntil}");
            Console.WriteLine($"📢 Tipo: {type}");

            // 1. Notificar a todos los admins (siempre)
            var admins = await GetAdminUsers();
            foreach (var admin in admins)
            {
                await _hubContext.Clients.Group($"user-{admin.Id}").SendAsync("ReceiveNotification", new
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = title,
                    Message = message,
                    Type = type,
                    Timestamp = DateTime.UtcNow,
                    Read = false,
                    Data = new { equipmentId = equipment.Id, daysUntil }
                });

                await SaveNotification(admin.Id, title, message, type, new { equipmentId = equipment.Id, daysUntil });
            }

            // 2. Notificar al responsable/creador (para notificaciones importantes)
            if (daysUntil <= 7 || daysUntil < 0)
            {
                var ownerTitle = title;
                var ownerMessage = $"Tu equipo '{equipment.Name}': {message.ToLower()}";
                var ownerType = $"{type}_owner";

                await _hubContext.Clients.Group($"user-{equipment.CreatedById}").SendAsync("ReceiveNotification", new
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = ownerTitle,
                    Message = ownerMessage,
                    Type = ownerType,
                    Timestamp = DateTime.UtcNow,
                    Read = false,
                    Data = new { equipmentId = equipment.Id, daysUntil }
                });

                await SaveNotification(equipment.CreatedById, ownerTitle, ownerMessage, ownerType, new { equipmentId = equipment.Id, daysUntil });
            }

            Console.WriteLine($"✅ Notificaciones de calibración enviadas");
            Console.WriteLine($"========================================");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enviando notificación de calibración");
        }
    }

    public async Task NotifyExperimentStatusChanged(Experiment experiment)
    {
        try
        {
            var user = await _context.Users.FindAsync(experiment.CreatedById);
            if (user == null) return;

            var statusEmoji = experiment.Status switch
            {
                ExperimentStatus.Completed => "✅",
                ExperimentStatus.Failed => "❌",
                ExperimentStatus.InProgress => "⚗️",
                _ => "📝"
            };

            var title = $"{statusEmoji} Experimento {experiment.Status}";
            var message = $"El experimento '{experiment.Name}' ha cambiado a estado {experiment.Status}";
            var type = "experiment_status";

            await _hubContext.Clients.Group($"user-{experiment.CreatedById}").SendAsync("ReceiveNotification", new
            {
                Id = Guid.NewGuid().ToString(),
                Title = title,
                Message = message,
                Type = type,
                Timestamp = DateTime.UtcNow,
                Read = false,
                Data = new { experimentId = experiment.Id }
            });

            await SaveNotification(experiment.CreatedById, title, message, type, new { experimentId = experiment.Id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enviando notificación de experimento");
        }
    }

    // Método helper para obtener admins
    private async Task<List<User>> GetAdminUsers()
    {
        return await _context.Users
            .Where(u => u.IsActive && _context.UserRoles
                .Any(ur => ur.UserId == u.Id && _context.Roles
                    .Where(r => r.Name == "ADMIN")
                    .Select(r => r.Id)
                    .Contains(ur.RoleId)))
            .ToListAsync();
    }

    // Método para probar
    public async Task TestNotification(string userId)
    {
        try
        {
            var title = "🧪 NOTIFICACIÓN DE PRUEBA";
            var message = "¡SignalR funciona correctamente!";
            var type = "test";

            await _hubContext.Clients.Group($"user-{userId}").SendAsync("ReceiveNotification", new
            {
                Id = Guid.NewGuid().ToString(),
                Title = title,
                Message = message,
                Type = type,
                Timestamp = DateTime.UtcNow,
                Read = false
            });

            if (Guid.TryParse(userId, out var userGuid))
            {
                await SaveNotification(userGuid, title, message, type);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enviando notificación de prueba");
        }
    }
}
