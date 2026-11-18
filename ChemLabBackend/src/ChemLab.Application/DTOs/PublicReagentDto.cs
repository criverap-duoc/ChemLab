/// <summary>
/// F11.1: proyección de SOLO LECTURA que expone GET /api/public/inventory
/// (integración con QuimioResponde).
///
/// Deliberadamente NO incluye datos internos ni de usuario: sin CreatedById, CreatedBy,
/// CreatedAt, UpdatedAt ni IsActive. Se declara en el namespace global igual que
/// ReagentDto.cs para mantener la convención existente de la carpeta DTOs.
/// </summary>
public class PublicReagentDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? CasNumber { get; set; }
    public string? ChemicalFormula { get; set; }
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = "g";
    public string Location { get; set; } = string.Empty;

    /// <summary>Nivel de peligro como entero (0=None, 1=Low, 2=Moderate, 3=High, 4=Extreme).</summary>
    public int HazardLevel { get; set; }

    public DateTime? ExpiryDate { get; set; }

    /// <summary>Días hasta el vencimiento; null si el reactivo no tiene fecha de vencimiento.</summary>
    public int? DaysUntilExpiry { get; set; }

    public bool IsExpired { get; set; }
    public bool IsLowStock { get; set; }
}
