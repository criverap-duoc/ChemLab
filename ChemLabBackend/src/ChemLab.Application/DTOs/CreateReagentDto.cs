using ChemLab.Domain.Enums;

public class CreateReagentDto
{
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
}
