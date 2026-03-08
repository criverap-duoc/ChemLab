using ChemLab.Domain.Enums;

namespace ChemLab.Application.DTOs;

public class EquipmentDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public string Location { get; set; } = string.Empty;
    public EquipmentStatus Status { get; set; }
    public DateTime? LastCalibration { get; set; }
    public DateTime? NextCalibration { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateEquipmentDto
{
    public string Name { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string? SerialNumber { get; set; }
    public string Location { get; set; } = string.Empty;
    public EquipmentStatus Status { get; set; } = EquipmentStatus.Available;
    public DateTime? LastCalibration { get; set; }
    public DateTime? NextCalibration { get; set; }
}

public class UpdateEquipmentDto
{
    public string? Name { get; set; }
    public string? Model { get; set; }
    public string? SerialNumber { get; set; }
    public string? Location { get; set; }
    public EquipmentStatus? Status { get; set; }
    public DateTime? LastCalibration { get; set; }
    public DateTime? NextCalibration { get; set; }
}
