// ChemLabBackend\src\ChemLab.API\Endpoints\ReagentsEndpoints.cs
using ChemLab.Application.DTOs;
using ChemLab.Domain.Entities;
using ChemLab.Domain.Enums;
using ChemLab.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ChemLab.API.Services;

namespace ChemLab.API.Endpoints;

public static class ReagentsEndpoints
{
    public static void MapReagentsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/reagents").RequireAuthorization();

        group.MapGet("/", GetAllReagents)
            .WithName("GetAllReagents");
            // .WithOpenApi(); // Comentado temporalmente

        group.MapGet("/{id:guid}", GetReagentById)
            .WithName("GetReagentById");
            // .WithOpenApi();

        group.MapPost("/", CreateReagent)
            .WithName("CreateReagent");
            // .WithOpenApi();

        group.MapPut("/{id:guid}", UpdateReagent)
            .WithName("UpdateReagent");
            // .WithOpenApi();

        group.MapDelete("/{id:guid}", DeleteReagent)
            .WithName("DeleteReagent");
            // .WithOpenApi();
    }

    private static async Task<IResult> GetAllReagents(
        ApplicationDbContext context,
        HttpContext httpContext,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var reagents = await context.Reagents
            .Where(r => r.IsActive)
            .Include(r => r.CreatedBy)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ReagentDto
            {
                Id = r.Id,
                Name = r.Name,
                ChemicalFormula = r.ChemicalFormula,
                CasNumber = r.CasNumber,
                Quantity = r.Quantity,
                Unit = r.Unit,
                Location = r.Location,
                HazardLevel = r.HazardLevel,
                Supplier = r.Supplier,
                ExpiryDate = r.ExpiryDate,
                CreatedBy = $"{r.CreatedBy.FirstName} {r.CreatedBy.LastName}",
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        var totalCount = await context.Reagents.CountAsync(r => r.IsActive);

        return Results.Ok(new
        {
            Data = reagents,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    private static async Task<IResult> GetReagentById(
        Guid id,
        ApplicationDbContext context)
    {
        var reagent = await context.Reagents
            .Include(r => r.CreatedBy)
            .FirstOrDefaultAsync(r => r.Id == id && r.IsActive);

        if (reagent is null)
            return Results.NotFound(new { Message = "Reagent not found" });

        var reagentDto = new ReagentDto
        {
            Id = reagent.Id,
            Name = reagent.Name,
            ChemicalFormula = reagent.ChemicalFormula,
            CasNumber = reagent.CasNumber,
            Quantity = reagent.Quantity,
            Unit = reagent.Unit,
            Location = reagent.Location,
            HazardLevel = reagent.HazardLevel,
            Supplier = reagent.Supplier,
            ExpiryDate = reagent.ExpiryDate,
            CreatedBy = $"{reagent.CreatedBy.FirstName} {reagent.CreatedBy.LastName}",
            CreatedAt = reagent.CreatedAt
        };

        return Results.Ok(reagentDto);
    }

    private static async Task<IResult> CreateReagent(
        [FromBody] CreateReagentDto dto,
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor,
        INotificationService notificationService)  // <-- AGREGAR
    {
        var userIdClaim = httpContextAccessor.HttpContext?.User.FindFirst("sub")?.Value
            ?? httpContextAccessor.HttpContext?.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (!Guid.TryParse(userIdClaim, out var userId))
            return Results.Unauthorized();

        var reagent = new Reagent
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
            CreatedById = userId
        };

        context.Reagents.Add(reagent);
        await context.SaveChangesAsync();

        // 🔥 VERIFICAR STOCK BAJO TAMBIÉN EN CREACIÓN
        if (reagent.Quantity <= reagent.MinQuantity)
        {
            Console.WriteLine($"🔔 NUEVO REACTIVO CON STOCK BAJO: {reagent.Name}");
            await notificationService.NotifyLowStock(reagent);
        }

        return Results.Created($"/api/reagents/{reagent.Id}", new { Id = reagent.Id });
    }

    private static async Task<IResult> UpdateReagent(
        Guid id,
        [FromBody] UpdateReagentDto dto,
        ApplicationDbContext context,
        INotificationService notificationService)
    {
        var reagent = await context.Reagents.FindAsync(id);

        if (reagent is null || !reagent.IsActive)
            return Results.NotFound(new { Message = "Reagent not found" });

        // Guardar valores anteriores para debug
        var oldQuantity = reagent.Quantity;
        var oldMinQuantity = reagent.MinQuantity;

        reagent.Name = dto.Name ?? reagent.Name;
        reagent.ChemicalFormula = dto.ChemicalFormula ?? reagent.ChemicalFormula;
        reagent.CasNumber = dto.CasNumber ?? reagent.CasNumber;
        reagent.Quantity = dto.Quantity ?? reagent.Quantity;
        reagent.Unit = dto.Unit ?? reagent.Unit;
        reagent.Location = dto.Location ?? reagent.Location;
        reagent.HazardLevel = dto.HazardLevel ?? reagent.HazardLevel;
        reagent.Supplier = dto.Supplier ?? reagent.Supplier;
        reagent.ExpiryDate = dto.ExpiryDate ?? reagent.ExpiryDate;
        reagent.MinQuantity = dto.MinQuantity ?? reagent.MinQuantity;
        reagent.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();

        // LOGS PARA DEBUG
        Console.WriteLine("=================================");
        Console.WriteLine($"🔍 REAGENTE ACTUALIZADO: {reagent.Name}");
        Console.WriteLine($"📊 Quantity: {reagent.Quantity}, MinQuantity: {reagent.MinQuantity}");
        Console.WriteLine($"📉 Stock bajo?: {reagent.Quantity <= reagent.MinQuantity}");

        if (reagent.Quantity <= reagent.MinQuantity)
        {
            Console.WriteLine("✅ CONDICIÓN DE STOCK BAJO CUMPLIDA - Enviando notificación...");
            await notificationService.NotifyLowStock(reagent);
            Console.WriteLine("✅ NOTIFICACIÓN ENVIADA (después de llamar al servicio)");
        }
        else
        {
            Console.WriteLine("❌ Stock normal, no se envía notificación");
        }
        Console.WriteLine("=================================");

        return Results.Ok(new { Message = "Reagent updated successfully" });
    }

    private static async Task<IResult> DeleteReagent(
        Guid id,
        ApplicationDbContext context)
    {
        var reagent = await context.Reagents.FindAsync(id);

        if (reagent is null)
            return Results.NotFound(new { Message = "Reagent not found" });

        reagent.IsActive = false;
        reagent.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();

        return Results.Ok(new { Message = "Reagent deleted successfully" });
    }
}
