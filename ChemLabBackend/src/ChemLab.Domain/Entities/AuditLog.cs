using System;

namespace ChemLab.Domain.Entities;

/// <summary>
/// F7c: registro de auditoría mínimo para trazabilidad (historial de entidades).
/// El middleware que escribe estos registros se implementa en F8; por ahora la
/// tabla existe y el endpoint de historial devuelve lista vacía cuando no hay datos.
/// </summary>
public class AuditLog
{
    public Guid Id { get; set; }

    /// <summary>Tipo de entidad afectada: "reagent", "equipment", "experiment", "request".</summary>
    public string EntityType { get; set; } = string.Empty;

    /// <summary>Identificador de la entidad afectada (como string para no atarse al tipo de Id).</summary>
    public string EntityId { get; set; } = string.Empty;

    /// <summary>Acción realizada: CREATE, UPDATE, DELETE, TRANSFER.</summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>Usuario que ejecutó la acción. Nullable para acciones del sistema.</summary>
    public Guid? UserId { get; set; }

    public string UserName { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; }

    /// <summary>Estado anterior serializado como JSON.</summary>
    public string? OldValue { get; set; }

    /// <summary>Estado nuevo serializado como JSON.</summary>
    public string? NewValue { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }
}
