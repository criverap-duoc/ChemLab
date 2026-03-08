using ChemLab.Domain.Enums;

namespace ChemLab.Domain.Entities;

public class Reagent
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ChemicalFormula { get; set; } = string.Empty;
    public string? CasNumber { get; set; }
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = "g";
    public string Location { get; set; } = string.Empty;
    public HazardLevel HazardLevel { get; set; }
    public string? Supplier { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public decimal MinQuantity { get; set; }
    public bool IsActive { get; set; } = true;

    // Audit
    public Guid CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public virtual User CreatedBy { get; set; } = null!;
}
