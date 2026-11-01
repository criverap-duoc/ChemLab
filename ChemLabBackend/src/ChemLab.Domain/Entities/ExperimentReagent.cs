using System;

namespace ChemLab.Domain.Entities;

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
