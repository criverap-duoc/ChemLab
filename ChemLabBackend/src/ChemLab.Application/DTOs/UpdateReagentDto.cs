using ChemLab.Domain.Enums;

public class UpdateReagentDto
{
    public string? Name { get; set; }
    public string? ChemicalFormula { get; set; }
    public string? CasNumber { get; set; }
    public decimal? Quantity { get; set; }
    public string? Unit { get; set; }
    public string? Location { get; set; }
    public HazardLevel? HazardLevel { get; set; }
    public string? Supplier { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public decimal? MinQuantity { get; set; }
}
