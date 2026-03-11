// ChemLabBackend\src\ChemLab.API\Endpoints\RequestEndpoints.cs
using ChemLab.Domain.Entities;
using ChemLab.Domain.Enums;
using ChemLab.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ChemLab.API.Services;

namespace ChemLab.API.Endpoints;

public static class RequestEndpoints
{
    public static void MapRequestEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/requests").RequireAuthorization();

        group.MapGet("/", GetAllRequests);
        group.MapGet("/{id:guid}", GetRequestById);
        group.MapGet("/my", GetMyRequests);
        group.MapGet("/admin", GetAllRequestsAdmin);
        group.MapPost("/", CreateRequest);
        group.MapPost("/test-notification", async (
            [FromBody] TestNotificationDto dto,
            INotificationService notificationService) =>
        {
            await notificationService.TestNotification(dto.UserId);
            return Results.Ok(new { Message = "Notificación de prueba enviada" });
        });
        group.MapPut("/{id:guid}/approve", ApproveRequest);
        group.MapPut("/{id:guid}/reject", RejectRequest);
        group.MapPut("/{id:guid}/cancel", CancelRequest);
        group.MapDelete("/{id:guid}", DeleteRequest);
    }

    private static async Task<IResult> GetAllRequests(
        ApplicationDbContext context,
        HttpContext httpContext,
        [FromQuery] RequestStatus? status = null,
        [FromQuery] RequestType? type = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Results.Unauthorized();

        var isAdmin = httpContext.User.IsInRole("ADMIN");

        var query = context.Requests
            .Include(r => r.RequestedBy)
            .Include(r => r.ApprovedBy)
            .Include(r => r.Items)
            .Where(r => r.Status != RequestStatus.Cancelled)
            .AsQueryable();

        if (!isAdmin)
        {
            query = query.Where(r => r.RequestedById == userId);
        }

        if (status.HasValue)
            query = query.Where(r => r.Status == status);

        if (type.HasValue)
            query = query.Where(r => r.Type == type);

        var totalCount = await query.CountAsync();
        var requests = await query
            .OrderByDescending(r => r.RequestedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new
            {
                r.Id,
                r.Title,
                r.Description,
                Type = r.Type.ToString(),
                Status = r.Status.ToString(),
                Priority = r.Priority.ToString(),
                r.RequestedAt,
                r.ExpectedDate,
                RequestedBy = $"{r.RequestedBy.FirstName} {r.RequestedBy.LastName}",
                ApprovedBy = r.ApprovedBy != null ? $"{r.ApprovedBy.FirstName} {r.ApprovedBy.LastName}" : null,
                ItemsCount = r.Items.Count,
                TotalItems = r.Items.Sum(i => (double?)i.Quantity) ?? 0
            })
            .ToListAsync();

        return Results.Ok(new
        {
            Data = requests,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    private static async Task<IResult> GetAllRequestsAdmin(
        ApplicationDbContext context,
        HttpContext httpContext,
        [FromQuery] RequestStatus? status = null,
        [FromQuery] RequestType? type = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        // Verificar si es admin
        var isAdmin = httpContext.User.IsInRole("ADMIN");
        if (!isAdmin)
            return Results.Forbid();

        var query = context.Requests
            .Include(r => r.RequestedBy)
            .Include(r => r.ApprovedBy)
            .Include(r => r.Items)
            .Where(r => r.Status != RequestStatus.Cancelled)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(r => r.Status == status);

        if (type.HasValue)
            query = query.Where(r => r.Type == type);

        var totalCount = await query.CountAsync();
        var requests = await query
            .OrderByDescending(r => r.RequestedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new
            {
                r.Id,
                r.Title,
                r.Description,
                Type = r.Type.ToString(),
                Status = r.Status.ToString(),
                Priority = r.Priority.ToString(),
                r.RequestedAt,
                r.ExpectedDate,
                RequestedBy = $"{r.RequestedBy.FirstName} {r.RequestedBy.LastName}",
                ApprovedBy = r.ApprovedBy != null ? $"{r.ApprovedBy.FirstName} {r.ApprovedBy.LastName}" : null,
                ItemsCount = r.Items.Count,
                TotalItems = r.Items.Sum(i => (double?)i.Quantity) ?? 0
            })
            .ToListAsync();

        return Results.Ok(new
        {
            Data = requests,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    private static async Task<IResult> GetMyRequests(
        HttpContext httpContext,
        ApplicationDbContext context,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Results.Unauthorized();

        var query = context.Requests
            .Include(r => r.Items)
            .Where(r => r.RequestedById == userId)
            .OrderByDescending(r => r.RequestedAt);

        var totalCount = await query.CountAsync();
        var requests = await query
            .OrderByDescending(r => r.RequestedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new
            {
                r.Id,
                r.Title,
                r.Description,
                Type = r.Type.ToString(),
                Status = r.Status.ToString(),
                Priority = r.Priority.ToString(),
                r.RequestedAt,
                r.ExpectedDate,
                RequestedBy = $"{r.RequestedBy.FirstName} {r.RequestedBy.LastName}",
                ApprovedBy = r.ApprovedBy != null ? $"{r.ApprovedBy.FirstName} {r.ApprovedBy.LastName}" : null,
                ItemsCount = r.Items.Count,
                // Convertir a double para que SQLite pueda sumar
                TotalItems = r.Items.Sum(i => (double?)i.Quantity) ?? 0
            })
            .ToListAsync();

        return Results.Ok(new
        {
            Data = requests,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    private static async Task<IResult> GetRequestById(
        Guid id,
        ApplicationDbContext context)
    {
        var request = await context.Requests
            .Include(r => r.RequestedBy)
            .Include(r => r.ApprovedBy)
            .Include(r => r.Items)  // <-- ESTO ES CRÍTICO, ESTABA FALTANDO
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request is null)
            return Results.NotFound();

        return Results.Ok(new
        {
            request.Id,
            request.Title,
            request.Description,
            Type = request.Type.ToString(),
            Status = request.Status.ToString(),
            Priority = request.Priority.ToString(),
            request.RequestedAt,
            request.ExpectedDate,
            request.ResolvedAt,
            request.Comments,
            request.RejectionReason,
            RequestedBy = new
            {
                request.RequestedBy.Id,
                Name = $"{request.RequestedBy.FirstName} {request.RequestedBy.LastName}",
                request.RequestedBy.Email
            },
            ApprovedBy = request.ApprovedBy != null ? new
            {
                request.ApprovedBy.Id,
                Name = $"{request.ApprovedBy.FirstName} {request.ApprovedBy.LastName}"
            } : null,
            Items = request.Items.Select(i => new  // <-- AHORA SÍ TENEMOS ACCESO A ITEMS
            {
                i.Id,
                i.ItemName,
                i.CatalogNumber,
                i.CasNumber,
                i.Quantity,
                i.Unit,
                i.Specifications,
                i.Supplier,
                i.EstimatedPrice
            })
        });
    }

    private static async Task<IResult> CreateRequest(
        [FromBody] CreateRequestDto dto,
        ApplicationDbContext context,
        HttpContext httpContext,
        INotificationService notificationService)
    {
        var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Results.Unauthorized();

        var request = new Request
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            Type = dto.Type,
            Status = RequestStatus.Pending,
            Priority = dto.Priority,
            RequestedAt = DateTime.UtcNow,
            ExpectedDate = dto.ExpectedDate,
            RequestedById = userId
        };

        if (dto.Items != null && dto.Items.Any())
        {
            foreach (var itemDto in dto.Items)
            {
                request.Items.Add(new RequestItem
                {
                    Id = Guid.NewGuid(),
                    ItemName = itemDto.ItemName,
                    CatalogNumber = itemDto.CatalogNumber,
                    CasNumber = itemDto.CasNumber,
                    Quantity = itemDto.Quantity,
                    Unit = itemDto.Unit,
                    Specifications = itemDto.Specifications,
                    Supplier = itemDto.Supplier,
                    EstimatedPrice = itemDto.EstimatedPrice
                });
            }
        }

        context.Requests.Add(request);
        await context.SaveChangesAsync();

        await notificationService.NotifyNewRequest(request);

        return Results.Created($"/api/requests/{request.Id}", new { request.Id });
    }

    private static async Task<IResult> ApproveRequest(
        Guid id,
        [FromBody] ApproveRequestDto dto,
        ApplicationDbContext context,
        HttpContext httpContext,
        INotificationService notificationService)
    {
        var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Results.Unauthorized();

        var request = await context.Requests.FindAsync(id);
        if (request is null)
            return Results.NotFound();

        if (request.Status != RequestStatus.Pending)
            return Results.BadRequest(new { Message = "Only pending requests can be approved" });

        request.Status = RequestStatus.Approved;
        request.ApprovedById = userId;
        request.ResolvedAt = DateTime.UtcNow;
        request.Comments = dto.Comments;

        await context.SaveChangesAsync();

        await notificationService.NotifyRequestStatusChanged(request);

        return Results.Ok(new { Message = "Request approved successfully" });
    }

    private static async Task<IResult> RejectRequest(
        Guid id,
        [FromBody] RejectRequestDto dto,
        ApplicationDbContext context,
        HttpContext httpContext)
    {
        var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Results.Unauthorized();

        var request = await context.Requests.FindAsync(id);
        if (request is null)
            return Results.NotFound();

        if (request.Status != RequestStatus.Pending)
            return Results.BadRequest(new { Message = "Only pending requests can be rejected" });

        request.Status = RequestStatus.Rejected;
        request.ApprovedById = userId;
        request.ResolvedAt = DateTime.UtcNow;
        request.RejectionReason = dto.RejectionReason;

        await context.SaveChangesAsync();
        return Results.Ok(new { Message = "Request rejected successfully" });
    }

    private static async Task<IResult> CancelRequest(
        Guid id,
        ApplicationDbContext context,
        HttpContext httpContext)
    {
        var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Results.Unauthorized();

        var request = await context.Requests.FindAsync(id);
        if (request is null)
            return Results.NotFound();

        if (request.RequestedById != userId)
            return Results.Forbid();

        if (request.Status != RequestStatus.Pending)
            return Results.BadRequest(new { Message = "Only pending requests can be cancelled" });

        request.Status = RequestStatus.Cancelled;
        request.ResolvedAt = DateTime.UtcNow;

        await context.SaveChangesAsync();
        return Results.Ok(new { Message = "Request cancelled successfully" });
    }

    private static async Task<IResult> DeleteRequest(
        Guid id,
        ApplicationDbContext context)
    {
        var request = await context.Requests.FindAsync(id);
        if (request is null)
            return Results.NotFound();

        context.Requests.Remove(request);
        await context.SaveChangesAsync();

        return Results.Ok(new { Message = "Request deleted successfully" });
    }
}

// DTOs
public class CreateRequestDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public RequestType Type { get; set; }
    public RequestPriority Priority { get; set; }
    public DateTime? ExpectedDate { get; set; }
    public List<CreateRequestItemDto> Items { get; set; } = new();
}

public class CreateRequestItemDto
{
    public string ItemName { get; set; } = string.Empty;
    public decimal? Quantity { get; set; }
    public string? Unit { get; set; }
    public string? CatalogNumber { get; set; }
    public string? CasNumber { get; set; }
    public string? Specifications { get; set; }
    public string? Supplier { get; set; }
    public decimal? EstimatedPrice { get; set; }
}

public class ApproveRequestDto
{
    public string? Comments { get; set; }
}

public class RejectRequestDto
{
    public string RejectionReason { get; set; } = string.Empty;
}

public class TestNotificationDto
{
    public string UserId { get; set; } = string.Empty;
}
