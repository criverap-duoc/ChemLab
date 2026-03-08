using ChemLab.Application.DTOs;
using ChemLab.Domain.Entities;
using ChemLab.Domain.Enums;
using ChemLab.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChemLab.API.Endpoints;

public static class EquipmentEndpoints
{
    public static void MapEquipmentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/equipment").RequireAuthorization();

        group.MapGet("/", GetAllEquipment)
            .WithName("GetAllEquipment");
            // .WithOpenApi();

        group.MapGet("/{id:guid}", GetEquipmentById)
            .WithName("GetEquipmentById");
            // .WithOpenApi();

        group.MapPost("/", CreateEquipment)
            .WithName("CreateEquipment");
            // .WithOpenApi();

        group.MapPut("/{id:guid}", UpdateEquipment)
            .WithName("UpdateEquipment");
            // .WithOpenApi();

        group.MapDelete("/{id:guid}", DeleteEquipment)
            .WithName("DeleteEquipment");
            // .WithOpenApi();
    }

    private static async Task<IResult> GetAllEquipment(
        ApplicationDbContext context,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var equipment = await context.Equipment
            .Where(e => e.IsActive)
            .Include(e => e.CreatedBy)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new EquipmentDto
            {
                Id = e.Id,
                Name = e.Name,
                Model = e.Model,
                SerialNumber = e.SerialNumber,
                Location = e.Location,
                Status = e.Status,
                LastCalibration = e.LastCalibration,
                NextCalibration = e.NextCalibration,
                CreatedBy = $"{e.CreatedBy.FirstName} {e.CreatedBy.LastName}",
                CreatedAt = e.CreatedAt
            })
            .ToListAsync();

        var totalCount = await context.Equipment.CountAsync(e => e.IsActive);

        return Results.Ok(new
        {
            Data = equipment,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    private static async Task<IResult> GetEquipmentById(
        Guid id,
        ApplicationDbContext context)
    {
        var equipment = await context.Equipment
            .Include(e => e.CreatedBy)
            .FirstOrDefaultAsync(e => e.Id == id && e.IsActive);

        if (equipment is null)
            return Results.NotFound(new { Message = "Equipment not found" });

        var equipmentDto = new EquipmentDto
        {
            Id = equipment.Id,
            Name = equipment.Name,
            Model = equipment.Model,
            SerialNumber = equipment.SerialNumber,
            Location = equipment.Location,
            Status = equipment.Status,
            LastCalibration = equipment.LastCalibration,
            NextCalibration = equipment.NextCalibration,
            CreatedBy = $"{equipment.CreatedBy.FirstName} {equipment.CreatedBy.LastName}",
            CreatedAt = equipment.CreatedAt
        };

        return Results.Ok(equipmentDto);
    }

    private static async Task<IResult> CreateEquipment(
        [FromBody] CreateEquipmentDto dto,
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor)
    {
        var userIdClaim = httpContextAccessor.HttpContext?.User.FindFirst("sub")?.Value
            ?? httpContextAccessor.HttpContext?.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (!Guid.TryParse(userIdClaim, out var userId))
            return Results.Unauthorized();

        var equipment = new Equipment
        {
            Name = dto.Name,
            Model = dto.Model,
            SerialNumber = dto.SerialNumber,
            Location = dto.Location,
            Status = dto.Status,
            LastCalibration = dto.LastCalibration,
            NextCalibration = dto.NextCalibration,
            CreatedById = userId
        };

        context.Equipment.Add(equipment);
        await context.SaveChangesAsync();

        return Results.Created($"/api/equipment/{equipment.Id}", new { Id = equipment.Id });
    }

    private static async Task<IResult> UpdateEquipment(
        Guid id,
        [FromBody] UpdateEquipmentDto dto,
        ApplicationDbContext context)
    {
        var equipment = await context.Equipment.FindAsync(id);

        if (equipment is null || !equipment.IsActive)
            return Results.NotFound(new { Message = "Equipment not found" });

        equipment.Name = dto.Name ?? equipment.Name;
        equipment.Model = dto.Model ?? equipment.Model;
        equipment.SerialNumber = dto.SerialNumber ?? equipment.SerialNumber;
        equipment.Location = dto.Location ?? equipment.Location;
        equipment.Status = dto.Status ?? equipment.Status;
        equipment.LastCalibration = dto.LastCalibration ?? equipment.LastCalibration;
        equipment.NextCalibration = dto.NextCalibration ?? equipment.NextCalibration;
        equipment.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();

        return Results.Ok(new { Message = "Equipment updated successfully" });
    }

    private static async Task<IResult> DeleteEquipment(
        Guid id,
        ApplicationDbContext context)
    {
        var equipment = await context.Equipment.FindAsync(id);

        if (equipment is null)
            return Results.NotFound(new { Message = "Equipment not found" });

        equipment.IsActive = false;
        equipment.UpdatedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();

        return Results.Ok(new { Message = "Equipment deleted successfully" });
    }
}
