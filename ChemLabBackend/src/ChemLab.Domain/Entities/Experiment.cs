using System;
using System.Collections.Generic;

namespace ChemLab.Domain.Entities;

public class Experiment
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ExperimentStatus Status { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Protocol { get; set; }
    public string? Results { get; set; }
    public string? Notes { get; set; }

    // Relaciones
    public Guid CreatedById { get; set; }
    public virtual User CreatedBy { get; set; } = null!;

    public virtual ICollection<ExperimentReagent> Reagents { get; set; } = new List<ExperimentReagent>();
    public virtual ICollection<ExperimentEquipment> Equipment { get; set; } = new List<ExperimentEquipment>();

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsActive { get; set; } = true;
}

public enum ExperimentStatus
{
    Planned = 0,
    InProgress = 1,
    Completed = 2,
    Cancelled = 3,
    Failed = 4
}

public class ExperimentReagent
{
    public Guid Id { get; set; }
    public Guid ExperimentId { get; set; }
    public virtual Experiment Experiment { get; set; } = null!;

    public Guid ReagentId { get; set; }
    public virtual Reagent Reagent { get; set; } = null!;

    public decimal QuantityUsed { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? BatchNumber { get; set; }
}

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
