using System.ComponentModel.DataAnnotations;
using ChemLab.Domain.Entities;
using ChemLab.Domain.Enums;

namespace ChemLab.Application.UnitTests;

/// <summary>
/// F10.1: tests mínimos de reactivos. El mapeo DTO → entidad replica el que hace
/// ReagentsEndpoints.CreateReagent, para verificar el contrato sin levantar la API.
/// </summary>
public class ReagentTests
{
    private static Reagent ToEntity(CreateReagentDto dto, Guid createdById) => new()
    {
        Name = dto.Name,
        ChemicalFormula = dto.ChemicalFormula,
        CasNumber = dto.CasNumber,
        Quantity = dto.Quantity,
        Unit = dto.Unit,
        Location = dto.Location,
        HazardLevel = dto.HazardLevel,
        Supplier = dto.Supplier,
        ExpiryDate = dto.ExpiryDate,
        MinQuantity = dto.MinQuantity,
        CreatedById = createdById
    };

    /// <summary>Valida los DataAnnotations del DTO (System.ComponentModel.DataAnnotations).</summary>
    private static List<ValidationResult> Validate(object model)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(
            model,
            new ValidationContext(model),
            results,
            validateAllProperties: true);

        return results;
    }

    [Fact]
    public void CreateReagent_WithValidData_SetsProperties()
    {
        // Arrange
        var createdById = Guid.NewGuid();
        var expiryDate = new DateTime(2027, 12, 31, 0, 0, 0, DateTimeKind.Utc);

        var dto = new CreateReagentDto
        {
            Name = "Ácido sulfúrico",
            ChemicalFormula = "H2SO4",
            CasNumber = "7664-93-9",
            Quantity = 500m,
            Unit = "mL",
            Location = "Vitrina A1",
            HazardLevel = HazardLevel.High,
            Supplier = "Merck",
            ExpiryDate = expiryDate,
            MinQuantity = 100m
        };

        // Act
        var reagent = ToEntity(dto, createdById);

        // Assert
        Assert.Equal(dto.Name, reagent.Name);
        Assert.Equal(dto.ChemicalFormula, reagent.ChemicalFormula);
        Assert.Equal(dto.CasNumber, reagent.CasNumber);
        Assert.Equal(dto.Quantity, reagent.Quantity);
        Assert.Equal(dto.Unit, reagent.Unit);
        Assert.Equal(dto.Location, reagent.Location);
        Assert.Equal(dto.HazardLevel, reagent.HazardLevel);
        Assert.Equal(dto.Supplier, reagent.Supplier);
        Assert.Equal(dto.ExpiryDate, reagent.ExpiryDate);
        Assert.Equal(dto.MinQuantity, reagent.MinQuantity);
        Assert.Equal(createdById, reagent.CreatedById);

        // Valores por defecto de la entidad: activo y sin fecha de actualización.
        Assert.True(reagent.IsActive);
        Assert.Null(reagent.UpdatedAt);

        // El DTO con datos válidos no debe producir errores de validación.
        Assert.Empty(Validate(dto));
    }

    [Fact]
    public void CreateReagent_WithNegativeQuantity_IsInvalid()
    {
        // Arrange: cantidad y stock mínimo negativos (no tienen sentido en el inventario).
        var dto = new CreateReagentDto
        {
            Name = "Etanol",
            ChemicalFormula = "C2H6O",
            Quantity = -5m,
            Unit = "L",
            Location = "Bodega B2",
            HazardLevel = HazardLevel.Moderate,
            MinQuantity = -1m
        };

        // Act
        var errors = Validate(dto);

        // Assert: el contrato del DTO rechaza cantidades negativas en ambos campos.
        Assert.NotEmpty(errors);
        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(CreateReagentDto.Quantity)));
        Assert.Contains(errors, e => e.MemberNames.Contains(nameof(CreateReagentDto.MinQuantity)));

        // Y la cantidad negativa se conserva solo si alguien la persiste sin validar.
        var reagent = ToEntity(dto, Guid.NewGuid());
        Assert.True(reagent.Quantity < 0);
    }
}
