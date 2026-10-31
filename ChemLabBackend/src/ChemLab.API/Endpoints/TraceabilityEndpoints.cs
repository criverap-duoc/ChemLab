// ChemLabBackend\src\ChemLab.API\Endpoints\TraceabilityEndpoints.cs
using ChemLab.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace ChemLab.API.Endpoints;

/// <summary>
/// F7c: endpoint mínimo de trazabilidad. Devuelve el historial registrado en
/// AuditLogs para una entidad. Todavía NO hay middleware que escriba auditoría
/// (eso es F8), así que en la práctica devuelve [] hasta que se implemente.
/// </summary>
public static class TraceabilityEndpoints
{
    public static void MapTraceabilityEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/traceability").RequireAuthorization();

        group.MapGet("/history/{entityType}/{entityId}", GetEntityHistory)
            .WithName("GetEntityHistory");
    }

    private static async Task<IResult> GetEntityHistory(
        string entityType,
        string entityId,
        ApplicationDbContext context,
        [FromQuery] int take = 200)
    {
        if (string.IsNullOrWhiteSpace(entityType) || string.IsNullOrWhiteSpace(entityId))
            return Results.Ok(Array.Empty<object>());

        var type = entityType.Trim().ToLowerInvariant();
        var id = entityId.Trim().ToLowerInvariant();
        var limit = take is <= 0 or > 500 ? 200 : take;

        try
        {
            var history = await context.AuditLogs
                .AsNoTracking()
                .Where(a => a.EntityType.ToLower() == type && a.EntityId.ToLower() == id)
                .OrderByDescending(a => a.Timestamp)
                .Take(limit)
                .Select(a => new
                {
                    a.Id,
                    a.EntityType,
                    a.EntityId,
                    a.Action,
                    a.UserId,
                    a.UserName,
                    a.Timestamp,
                    a.OldValue,
                    a.NewValue,
                    a.IpAddress,
                    a.UserAgent
                })
                .ToListAsync();

            return Results.Ok(history);
        }
        catch (SqliteException)
        {
            // La migración AddAuditLogs aún no se aplicó en esta BD: sin tabla no
            // hay historial. Devolver [] evita un 500 en la UI mientras tanto.
            return Results.Ok(Array.Empty<object>());
        }
    }
}
