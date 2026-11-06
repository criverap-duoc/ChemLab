using System.ComponentModel.DataAnnotations;
using ChemLab.Domain.Enums;

public class CreateReagentDto
{
    public string Name { get; set; } = string.Empty;
    public string ChemicalFormula { get; set; } = string.Empty;
    public string? CasNumber { get; set; }

    // F10.1: contrato declarativo de validación. Una cantidad negativa no tiene sentido
    // físico en el inventario (el endpoint POST /api/reagents todavía no aplica filtros de
    // validación automáticos; los atributos documentan y son verificados por los tests).
    [Range(0, double.MaxValue, ErrorMessage = "La cantidad no puede ser negativa")]
    public decimal Quantity { get; set; }

    public string Unit { get; set; } = "g";
    public string Location { get; set; } = string.Empty;
    public HazardLevel HazardLevel { get; set; }
    public string? Supplier { get; set; }
    public DateTime? ExpiryDate { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "El stock mínimo no puede ser negativo")]
    public decimal MinQuantity { get; set; }
}
