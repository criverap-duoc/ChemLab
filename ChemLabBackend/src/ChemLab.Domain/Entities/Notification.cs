using System;

namespace ChemLab.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public bool IsRead { get; set; }
    public Guid UserId { get; set; }
    public virtual User User { get; set; } = null!;
    public string? Data { get; set; } // JSON con datos adicionales
}
