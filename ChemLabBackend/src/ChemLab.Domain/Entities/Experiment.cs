using System;
using System.Collections.Generic;
using ChemLab.Domain.Enums;

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

