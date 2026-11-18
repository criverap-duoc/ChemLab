// ChemLabBackend\src\ChemLab.API\Endpoints\PublicInventoryEndpoints.cs
using ChemLab.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChemLab.API.Endpoints;

/// <summary>
/// F11.1: API pública de SOLO LECTURA del inventario, pensada para la integración con
/// QuimioResponde.
///
/// Aislamiento deliberado:
/// - No usa .RequireAuthorization(): el único control de acceso es la API key del
///   ApiKeyFilter (header X-Api-Key, valor en PublicApi:ApiKey).
/// - No reutiliza ReagentDto (expone CreatedBy) ni el serializador de enums: la respuesta
///   usa PublicReagentDto con HazardLevel como entero.
/// - Solo expone reactivos con IsActive = true y ningún dato de usuario.
/// </summary>
public static class PublicInventoryEndpoints
{
    private const int MaxPageSize = 100;

    public static void MapPublicInventoryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/public").AddEndpointFilter<ApiKeyFilter>();

        group.MapGet("/inventory", GetInventory)
            .WithName("GetPublicInventory");
    }

    /// <summary>
    /// Inventario paginado con filtros opcionales. Filtros:
    /// expiringInDays (&gt; 0), expired (true), hazardLevel (0..4), location (parcial, sin
    /// distinguir mayúsculas) y casNumber (exacto). Orden: primero lo que vence antes
    /// (los reactivos sin fecha van al final) y, a igualdad, por nombre.
    /// </summary>
    private static async Task<IResult> GetInventory(
        HttpContext httpContext,
        ApplicationDbContext context,
        ILoggerFactory loggerFactory,
        [FromQuery] int? expiringInDays = null,
        [FromQuery] bool? expired = null,
        [FromQuery] int? hazardLevel = null,
        [FromQuery] string? location = null,
        [FromQuery] string? casNumber = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var logger = loggerFactory.CreateLogger(typeof(PublicInventoryEndpoints).FullName!);

        // Clamp de paginación: page >= 1 y 1 <= pageSize <= 100.
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 1;
        if (pageSize > MaxPageSize) pageSize = MaxPageSize;

        var now = DateTime.UtcNow;
        var cancellationToken = httpContext.RequestAborted;

        // Filtro base: la API pública nunca ve reactivos dados de baja lógica.
        var query = context.Reagents
            .AsNoTracking()
            .Where(r => r.IsActive);

        if (expiringInDays is > 0)
        {
            var limit = now.AddDays(expiringInDays.Value);
            query = query.Where(r => r.ExpiryDate.HasValue && r.ExpiryDate <= limit);
        }

        if (expired == true)
        {
            query = query.Where(r => r.ExpiryDate.HasValue && r.ExpiryDate < now);
        }

        if (hazardLevel is >= 0 and <= 4)
        {
            var level = hazardLevel!.Value;
            query = query.Where(r => (int)r.HazardLevel == level);
        }

        if (!string.IsNullOrWhiteSpace(location))
        {
            var locationTerm = location.Trim().ToLower();
            query = query.Where(r => r.Location.ToLower().Contains(locationTerm));
        }

        if (!string.IsNullOrWhiteSpace(casNumber))
        {
            var cas = casNumber.Trim();
            query = query.Where(r => r.CasNumber == cas);
        }

        // F11.1b: la consulta se aísla en un try/catch para que un fallo de base de datos
        // (PostgreSQL/Supabase caído, cadena de conexión inválida, esquema desalineado) se
        // registre con su excepción real en los logs y no se traduzca en un 500 opaco.
        try
        {
            var totalCount = await query.CountAsync(cancellationToken);

            // Se materializa la página de entidades y los campos calculados se resuelven en C#
            // (DaysUntilExpiry/IsExpired/IsLowStock) para no depender de traducciones SQL
            // distintas entre SQLite y PostgreSQL.
            //
            // F11.1b: el orden "sin fecha al final" se expresa con un predicado booleano en
            // lugar de `r.ExpiryDate ?? DateTime.MaxValue`. EF traduce DateTime.MaxValue a
            // `TIMESTAMPTZ 'infinity'`, un literal específico de PostgreSQL que rompe la
            // consulta si la columna no es `timestamp with time zone` (esquema creado con
            // otro tipo o con otra versión del proveedor). `ORDER BY (ExpiryDate IS NULL),`
            // es portable y semánticamente idéntico.
            var reagents = await query
                .OrderBy(r => r.ExpiryDate == null)
                .ThenBy(r => r.ExpiryDate)
                .ThenBy(r => r.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var data = reagents
                .Select(r => new PublicReagentDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    CasNumber = r.CasNumber,
                    ChemicalFormula = r.ChemicalFormula,
                    Quantity = r.Quantity,
                    Unit = r.Unit,
                    Location = r.Location,
                    HazardLevel = (int)r.HazardLevel,
                    ExpiryDate = r.ExpiryDate,
                    DaysUntilExpiry = r.ExpiryDate.HasValue
                        ? (int?)(r.ExpiryDate.Value - now).Days
                        : null,
                    IsExpired = r.ExpiryDate.HasValue && r.ExpiryDate.Value < now,
                    IsLowStock = r.Quantity <= r.MinQuantity
                })
                .ToList();

            return Results.Ok(new
            {
                Data = data,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // El cliente cerró la conexión antes de terminar: no es un fallo del servidor.
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "F11.1: fallo al consultar el inventario público " +
                "(expiringInDays={ExpiringInDays}, expired={Expired}, hazardLevel={HazardLevel}, " +
                "hasLocation={HasLocation}, hasCasNumber={HasCasNumber}, page={Page}, pageSize={PageSize})",
                expiringInDays,
                expired,
                hazardLevel,
                !string.IsNullOrWhiteSpace(location),
                !string.IsNullOrWhiteSpace(casNumber),
                page,
                pageSize);

            // Mensaje genérico: no se filtra el detalle interno (host, SQL ni excepción).
            return Results.Problem(
                title: "No se pudo consultar el inventario público.",
                detail: "Error interno al acceder al inventario. Intente nuevamente más tarde.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }
}

