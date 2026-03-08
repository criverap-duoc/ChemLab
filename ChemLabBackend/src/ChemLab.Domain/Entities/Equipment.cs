using ChemLab.Domain.Enums;

namespace ChemLab.Domain.Entities;

public class Equipment
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public string Location { get; set; } = string.Empty;
    public EquipmentStatus Status { get; set; }
    public DateTime? LastCalibration { get; set; }
    public DateTime? NextCalibration { get; set; }
    public bool IsActive { get; set; } = true;

    // Audit
    public Guid CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public virtual User CreatedBy { get; set; } = null!;
}
