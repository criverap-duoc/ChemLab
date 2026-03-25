// ChemLabBackend\src\ChemLab.API\Endpoints\ExperimentEndpoints.cs
using ChemLab.Domain.Entities;
using ChemLab.Domain.Enums;
using ChemLab.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ChemLab.API.Services;

namespace ChemLab.API.Endpoints;

public static class ExperimentEndpoints
{
    public static void MapExperimentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/experiments").RequireAuthorization();

        group.MapGet("/", GetAllExperiments);
        group.MapGet("/{id:guid}", GetExperimentById);
        group.MapPost("/", CreateExperiment);
        group.MapPut("/{id:guid}", UpdateExperiment);
        group.MapDelete("/{id:guid}", DeleteExperiment);
        group.MapPost("/{id:guid}/reagents", AddReagent);
        group.MapPost("/{id:guid}/equipment", AddEquipment);
        group.MapPatch("/{id:guid}/status", UpdateStatus);
    }

    private static async Task<IResult> GetAllExperiments(
        ApplicationDbContext context,
        HttpContext httpContext,  // <-- AGREGAR
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] ExperimentStatus? status = null)
    {
        var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Results.Unauthorized();

        var query = context.Experiments
            .Include(e => e.CreatedBy)
            .Include(e => e.Reagents)
                .ThenInclude(r => r.Reagent)
            .Include(e => e.Equipment)
                .ThenInclude(eq => eq.Equipment)
            .Where(e => e.IsActive)
            .Where(e => e.CreatedById == userId)  // <-- FILTRAR POR USUARIO
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(e => e.Status == status);

        var totalCount = await query.CountAsync();
        var experiments = await query
            .OrderByDescending(e => e.StartDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new
            {
                e.Id,
                e.Name,
                e.Description,
                Status = e.Status.ToString(),
                e.StartDate,
                e.EndDate,
                e.Protocol,
                e.Notes,
                CreatedBy = $"{e.CreatedBy.FirstName} {e.CreatedBy.LastName}",
                ReagentsCount = e.Reagents.Count,
                EquipmentCount = e.Equipment.Count,
                Reagents = e.Reagents.Select(r => new { r.ReagentId, r.Reagent.Name, r.QuantityUsed, r.Unit, r.BatchNumber }),
                Equipment = e.Equipment.Select(eq => new { eq.EquipmentId, eq.Equipment.Name, eq.UsageHours }),
                e.CreatedAt,
                e.UpdatedAt
            })
            .ToListAsync();

        return Results.Ok(new
        {
            Data = experiments,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    private static async Task<IResult> GetExperimentById(
        Guid id,
        ApplicationDbContext context)
    {
        var experiment = await context.Experiments
            .Include(e => e.CreatedBy)
            .Include(e => e.Reagents)
                .ThenInclude(r => r.Reagent)
            .Include(e => e.Equipment)
                .ThenInclude(eq => eq.Equipment)
            .FirstOrDefaultAsync(e => e.Id == id && e.IsActive);

        if (experiment is null)
            return Results.NotFound();

        return Results.Ok(new
        {
            experiment.Id,
            experiment.Name,
            experiment.Description,
            Status = experiment.Status.ToString(),
            experiment.StartDate,
            experiment.EndDate,
            experiment.Protocol,
            experiment.Results,
            experiment.Notes,
            CreatedBy = $"{experiment.CreatedBy.FirstName} {experiment.CreatedBy.LastName}",
            Reagents = experiment.Reagents.Select(r => new
            {
                r.ReagentId,
                ReagentName = r.Reagent.Name,
                r.QuantityUsed,
                r.Unit,
                r.BatchNumber
            }),
            Equipment = experiment.Equipment.Select(eq => new
            {
                eq.EquipmentId,
                EquipmentName = eq.Equipment.Name,
                eq.UsageHours,
                eq.CalibrationBefore,
                eq.CalibrationAfter
            }),
            experiment.CreatedAt,
            experiment.UpdatedAt
        });
    }

    private static async Task<IResult> CreateExperiment(
        [FromBody] CreateExperimentDto dto,
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor)
    {
        var userIdClaim = httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Results.Unauthorized();

        var experiment = new Experiment
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Description = dto.Description,
            Status = ExperimentStatus.Planned,
            StartDate = dto.StartDate ?? DateTime.UtcNow,
            Protocol = dto.Protocol,
            Notes = dto.Notes,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        // Agregar reactivos
        if (dto.Reagents != null)
        {
            foreach (var reagent in dto.Reagents)
            {
                experiment.Reagents.Add(new ExperimentReagent
                {
                    Id = Guid.NewGuid(),
                    ReagentId = reagent.ReagentId,
                    QuantityUsed = reagent.QuantityUsed,
                    Unit = reagent.Unit,
                    BatchNumber = reagent.BatchNumber
                });
            }
        }

        // Agregar equipos
        if (dto.Equipment != null)
        {
            foreach (var eq in dto.Equipment)
            {
                experiment.Equipment.Add(new ExperimentEquipment
                {
                    Id = Guid.NewGuid(),
                    EquipmentId = eq.EquipmentId,
                    UsageHours = eq.UsageHours,
                    CalibrationBefore = eq.CalibrationBefore,
                    CalibrationAfter = eq.CalibrationAfter
                });
            }
        }

        context.Experiments.Add(experiment);
        await context.SaveChangesAsync();

        return Results.Created($"/api/experiments/{experiment.Id}", new { experiment.Id });
    }

    private static async Task<IResult> UpdateExperiment(
        Guid id,
        [FromBody] UpdateExperimentDto dto,
        ApplicationDbContext context)
    {
        // Cargar el experimento con sus relaciones
        var experiment = await context.Experiments
            .Include(e => e.Reagents)
            .Include(e => e.Equipment)
            .FirstOrDefaultAsync(e => e.Id == id && e.IsActive);

        if (experiment is null)
            return Results.NotFound();

        // Actualizar campos básicos
        experiment.Name = dto.Name ?? experiment.Name;
        experiment.Description = dto.Description ?? experiment.Description;
        experiment.Protocol = dto.Protocol ?? experiment.Protocol;
        experiment.Results = dto.Results ?? experiment.Results;
        experiment.Notes = dto.Notes ?? experiment.Notes;
        experiment.StartDate = dto.StartDate ?? experiment.StartDate;
        experiment.EndDate = dto.EndDate ?? experiment.EndDate;
        experiment.UpdatedAt = DateTime.UtcNow;

        // Actualizar reactivos (eliminar existentes y agregar nuevos)
        if (dto.Reagents != null)
        {
            // Eliminar los reactivos existentes
            context.ExperimentReagents.RemoveRange(experiment.Reagents);

            // Agregar los nuevos
            foreach (var reagent in dto.Reagents)
            {
                experiment.Reagents.Add(new ExperimentReagent
                {
                    Id = Guid.NewGuid(),
                    ExperimentId = id,
                    ReagentId = reagent.ReagentId,
                    QuantityUsed = reagent.QuantityUsed,
                    Unit = reagent.Unit,
                    BatchNumber = reagent.BatchNumber
                });
            }
        }

        // Actualizar equipos
        if (dto.Equipment != null)
        {
            // Eliminar los equipos existentes
            context.ExperimentEquipment.RemoveRange(experiment.Equipment);

            // Agregar los nuevos
            foreach (var eq in dto.Equipment)
            {
                experiment.Equipment.Add(new ExperimentEquipment
                {
                    Id = Guid.NewGuid(),
                    ExperimentId = id,
                    EquipmentId = eq.EquipmentId,
                    UsageHours = eq.UsageHours,
                    CalibrationBefore = eq.CalibrationBefore,
                    CalibrationAfter = eq.CalibrationAfter
                });
            }
        }

        await context.SaveChangesAsync();
        return Results.Ok(new { Message = "Experiment updated successfully" });
    }

    private static async Task<IResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateStatusDto dto,
        ApplicationDbContext context)
    {
        var experiment = await context.Experiments.FindAsync(id);
        if (experiment is null || !experiment.IsActive)
            return Results.NotFound();

        experiment.Status = dto.Status;
        experiment.UpdatedAt = DateTime.UtcNow;

        if (dto.Status == ExperimentStatus.Completed && !experiment.EndDate.HasValue)
            experiment.EndDate = DateTime.UtcNow;

        await context.SaveChangesAsync();
        return Results.Ok(new { Message = "Status updated successfully" });
    }

    private static async Task<IResult> AddReagent(
        Guid id,
        [FromBody] AddReagentDto dto,
        ApplicationDbContext context)
    {
        var experiment = await context.Experiments
            .Include(e => e.Reagents)
            .FirstOrDefaultAsync(e => e.Id == id && e.IsActive);

        if (experiment is null)
            return Results.NotFound();

        var reagent = await context.Reagents.FindAsync(dto.ReagentId);
        if (reagent is null)
            return Results.NotFound(new { Message = "Reagent not found" });

        // Verificar stock suficiente
        if (reagent.Quantity < dto.QuantityUsed)
            return Results.BadRequest(new { Message = "Insufficient stock" });

        var experimentReagent = new ExperimentReagent
        {
            Id = Guid.NewGuid(),
            ExperimentId = id,
            ReagentId = dto.ReagentId,
            QuantityUsed = dto.QuantityUsed,
            Unit = dto.Unit,
            BatchNumber = dto.BatchNumber
        };

        // Descontar del stock
        reagent.Quantity -= dto.QuantityUsed;
        reagent.UpdatedAt = DateTime.UtcNow;

        context.ExperimentReagents.Add(experimentReagent);
        await context.SaveChangesAsync();

        return Results.Ok(new { Message = "Reagent added to experiment" });
    }

    private static async Task<IResult> AddEquipment(
        Guid id,
        [FromBody] AddEquipmentDto dto,
        ApplicationDbContext context)
    {
        var experiment = await context.Experiments
            .Include(e => e.Equipment)
            .FirstOrDefaultAsync(e => e.Id == id && e.IsActive);

        if (experiment is null)
            return Results.NotFound();

        var equipment = await context.Equipment.FindAsync(dto.EquipmentId);
        if (equipment is null)
            return Results.NotFound(new { Message = "Equipment not found" });

        var experimentEquipment = new ExperimentEquipment
        {
            Id = Guid.NewGuid(),
            ExperimentId = id,
            EquipmentId = dto.EquipmentId,
            UsageHours = dto.UsageHours,
            CalibrationBefore = dto.CalibrationBefore,
            CalibrationAfter = dto.CalibrationAfter
        };

        // Marcar equipo como en uso
        if (experiment.Status == ExperimentStatus.InProgress)
            equipment.Status = EquipmentStatus.InUse;

        context.ExperimentEquipment.Add(experimentEquipment);
        await context.SaveChangesAsync();

        return Results.Ok(new { Message = "Equipment added to experiment" });
    }

    private static async Task<IResult> DeleteExperiment(
        Guid id,
        ApplicationDbContext context)
    {
        var experiment = await context.Experiments.FindAsync(id);
        if (experiment is null)
            return Results.NotFound();

        experiment.IsActive = false;
        experiment.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();
        return Results.Ok(new { Message = "Experiment deleted successfully" });
    }
}

// DTOs
public class CreateExperimentDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public string? Protocol { get; set; }
    public string? Notes { get; set; }
    public List<CreateExperimentReagentDto>? Reagents { get; set; }
    public List<CreateExperimentEquipmentDto>? Equipment { get; set; }
}

public class CreateExperimentReagentDto
{
    public Guid ReagentId { get; set; }
    public decimal QuantityUsed { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? BatchNumber { get; set; }
}

public class CreateExperimentEquipmentDto
{
    public Guid EquipmentId { get; set; }
    public double? UsageHours { get; set; }
    public string? CalibrationBefore { get; set; }
    public string? CalibrationAfter { get; set; }
}

public class UpdateExperimentDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Protocol { get; set; }
    public string? Results { get; set; }
    public string? Notes { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public List<UpdateExperimentReagentDto>? Reagents { get; set; }
    public List<UpdateExperimentEquipmentDto>? Equipment { get; set; }
}

public class UpdateExperimentReagentDto
{
    public Guid ReagentId { get; set; }
    public decimal QuantityUsed { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? BatchNumber { get; set; }
}

public class UpdateExperimentEquipmentDto
{
    public Guid EquipmentId { get; set; }
    public double? UsageHours { get; set; }
    public string? CalibrationBefore { get; set; }
    public string? CalibrationAfter { get; set; }
}

public class UpdateStatusDto
{
    public ExperimentStatus Status { get; set; }
}

public class AddReagentDto
{
    public Guid ReagentId { get; set; }
    public decimal QuantityUsed { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? BatchNumber { get; set; }
}

public class AddEquipmentDto
{
    public Guid EquipmentId { get; set; }
    public double? UsageHours { get; set; }
    public string? CalibrationBefore { get; set; }
    public string? CalibrationAfter { get; set; }
}
