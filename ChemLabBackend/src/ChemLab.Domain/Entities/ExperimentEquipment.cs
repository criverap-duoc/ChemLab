using System;

namespace ChemLab.Domain.Entities;

public class ExperimentEquipment
{
    public Guid Id { get; set; }
    public Guid ExperimentId { get; set; }
    public virtual Experiment Experiment { get; set; } = null!;

    public Guid EquipmentId { get; set; }
    public virtual Equipment Equipment { get; set; } = null!;

    public double? UsageHours { get; set; }
    public string? CalibrationBefore { get; set; }
    public string? CalibrationAfter { get; set; }
}
