// ChemLabBackend\src\ChemLab.API\Endpoints\UserEndpoints.cs
using ChemLab.Domain.Entities;
using ChemLab.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Security.Claims;

namespace ChemLab.API.Endpoints;

/// <summary>
/// F8.2: gestión de usuarios (/api/users). Todo el grupo exige la policy "AdminOnly"
/// (registrada en Program.cs: RequireRole("ADMIN") sobre el claim de la cookie de Identity).
///
/// Los roles se resuelven con SQL crudo sobre la MISMA conexión del DbContext por el mismo
/// motivo documentado en F6.5f (Identity con Guid + GuidToStringConverter devolvía vacío al
/// consultar AspNetUserRoles vía UserManager/LINQ).
/// </summary>
public static class UserEndpoints
{
    private const string AdminRole = "ADMIN";

    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users").RequireAuthorization("AdminOnly");

        group.MapGet("/", GetAllUsers)
            .WithName("GetAllUsers");

        group.MapPut("/{id:guid}/role", UpdateUserRole)
            .WithName("UpdateUserRole");

        group.MapPut("/{id:guid}/status", UpdateUserStatus)
            .WithName("UpdateUserStatus");

        group.MapDelete("/{id:guid}", DeleteUser)
            .WithName("DeleteUser");
    }

    /// <summary>
    /// Listado paginado de usuarios con su rol. Incluye activos e inactivos porque la vista
    /// /admin/users necesita poder reactivarlos. Filtros opcionales: search, isActive.
    /// Contrato alineado con frontend/src/types/index.ts (User) y userService.getAll().
    /// </summary>
    private static async Task<IResult> GetAllUsers(
        ApplicationDbContext context,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        if (page < 1) page = 1;
        if (pageSize is < 1 or > 200) pageSize = 50;

        var query = context.Users.AsNoTracking().AsQueryable();

        if (isActive.HasValue)
            query = query.Where(u => u.IsActive == isActive.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            query = query.Where(u =>
                (u.Email != null && u.Email.ToLower().Contains(term)) ||
                u.FirstName.ToLower().Contains(term) ||
                u.LastName.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var users = await query
            .OrderBy(u => u.Email)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                u.IsActive,
                u.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var rolesByUser = await LoadUserRolesAsync(context, cancellationToken);

        var data = users.Select(u => new
        {
            u.Id,
            u.Email,
            u.FirstName,
            u.LastName,
            Role = rolesByUser.TryGetValue(u.Id, out var role) ? role : "RESEARCHER",
            u.IsActive,
            u.CreatedAt,
            // El modelo User no persiste LastLogin: se devuelve null (la UI muestra “Nunca”).
            LastLogin = (DateTime?)null
        }).ToList();

        return Results.Ok(new
        {
            Data = data,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    /// <summary>
    /// Cambia el rol del usuario (body: { "role": "ADMIN" }). Valida que el rol exista en
    /// AspNetRoles y bloquea la degradación del último ADMIN activo.
    /// </summary>
    private static async Task<IResult> UpdateUserRole(
        Guid id,
        [FromBody] UpdateUserRoleRequest request,
        ApplicationDbContext context,
        UserManager<User> userManager,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(httpContext, out var currentUserId))
            return Results.Unauthorized();

        var roleName = request.Role?.Trim().ToUpperInvariant();
        if (string.IsNullOrEmpty(roleName))
            return Results.BadRequest(new { Message = "El rol es obligatorio" });

        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user is null)
            return Results.NotFound(new { Message = "Usuario no encontrado" });

        if (!await RoleExistsAsync(context, roleName, cancellationToken))
            return Results.BadRequest(new { Message = $"El rol '{roleName}' no existe" });

        var rolesByUser = await LoadUserRolesAsync(context, cancellationToken);
        var currentRole = rolesByUser.TryGetValue(id, out var existing) ? existing : null;

        if (string.Equals(currentRole, roleName, StringComparison.OrdinalIgnoreCase))
            return Results.Ok(new { Message = "El usuario ya tiene ese rol" });

        // Protección equivalente a la de status/delete: el ADMIN no puede quitarse su propio
        // rol (perdería el acceso al panel de administración en la siguiente petición).
        if (id == currentUserId &&
            string.Equals(currentRole, AdminRole, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(roleName, AdminRole, StringComparison.OrdinalIgnoreCase))
        {
            return Results.BadRequest(new { Message = "No puedes quitarte tu propio rol de administrador" });
        }

        // Protección: el sistema nunca puede quedarse sin ADMIN activo.
        if (string.Equals(currentRole, AdminRole, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(roleName, AdminRole, StringComparison.OrdinalIgnoreCase) &&
            await CountActiveAdminsAsync(context, rolesByUser, cancellationToken) <= 1)
        {
            return Results.BadRequest(new
            {
                Message = "No se puede quitar el rol ADMIN al último administrador activo"
            });
        }

        await SetUserRoleAsync(context, id, roleName, cancellationToken);

        user.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        // La cookie del afectado conserva los claims viejos hasta validar el stamp.
        await RefreshSecurityStampAsync(userManager, user, currentUserId);

        return Results.Ok(new { Message = $"Rol actualizado a {roleName}" });
    }

    /// <summary>
    /// Activa/desactiva un usuario (body: { "isActive": false }). No permite desactivarse a sí
    /// mismo ni desactivar al último ADMIN activo.
    /// </summary>
    private static async Task<IResult> UpdateUserStatus(
        Guid id,
        [FromBody] UpdateUserStatusRequest request,
        ApplicationDbContext context,
        UserManager<User> userManager,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(httpContext, out var currentUserId))
            return Results.Unauthorized();

        if (!request.IsActive.HasValue)
            return Results.BadRequest(new { Message = "El campo isActive es obligatorio" });

        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user is null)
            return Results.NotFound(new { Message = "Usuario no encontrado" });

        var newStatus = request.IsActive.Value;

        if (user.IsActive == newStatus)
            return Results.Ok(new { Message = "El usuario ya tiene ese estado" });

        if (!newStatus)
        {
            if (id == currentUserId)
                return Results.BadRequest(new { Message = "No puedes desactivar tu propia cuenta" });

            if (await IsOnlyActiveAdminAsync(context, id, cancellationToken))
            {
                return Results.BadRequest(new
                {
                    Message = "No se puede desactivar al último administrador activo"
                });
            }
        }

        user.IsActive = newStatus;
        user.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        // Al desactivar, la sesión abierta del afectado deja de ser válida en la próxima validación.
        await RefreshSecurityStampAsync(userManager, user, currentUserId);

        return Results.Ok(new { Message = newStatus ? "Usuario activado" : "Usuario desactivado" });
    }

    /// <summary>
    /// Baja lógica (IsActive = false), coherente con el resto de entidades del proyecto
    /// (Reagents/Equipment usan soft delete). No permite auto-eliminación ni dejar el
    /// sistema sin ADMIN activo.
    /// </summary>
    private static async Task<IResult> DeleteUser(
        Guid id,
        ApplicationDbContext context,
        UserManager<User> userManager,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (!TryGetCurrentUserId(httpContext, out var currentUserId))
            return Results.Unauthorized();

        if (id == currentUserId)
            return Results.BadRequest(new { Message = "No puedes eliminar tu propia cuenta" });

        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user is null)
            return Results.NotFound(new { Message = "Usuario no encontrado" });

        // Soft delete idempotente: la baja lógica es IsActive = false, así que un usuario ya
        // desactivado se considera ya eliminado (mismo estado final, sin error).
        if (!user.IsActive)
            return Results.Ok(new { Message = "El usuario ya estaba desactivado" });

        if (await IsOnlyActiveAdminAsync(context, id, cancellationToken))
            return Results.BadRequest(new { Message = "No se puede eliminar al último administrador activo" });

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        await RefreshSecurityStampAsync(userManager, user, currentUserId);

        return Results.Ok(new { Message = "Usuario eliminado" });
    }

    // ---------- Helpers ----------

    private static bool TryGetCurrentUserId(HttpContext httpContext, out Guid userId)
    {
        var value = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? httpContext.User.FindFirst("sub")?.Value;

        return Guid.TryParse(value, out userId);
    }

    /// <summary>
    /// Lee el join manual AspNetUserRoles + AspNetRoles por ADO.NET sobre la conexión del
    /// DbContext y devuelve UserId → nombre del rol. Se leen todos los pares de una vez
    /// (la tabla de roles de un laboratorio es diminuta) y se cruzan en memoria.
    /// </summary>
    private static async Task<Dictionary<Guid, string>> LoadUserRolesAsync(
        ApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        var map = new Dictionary<Guid, string>();

        var connection = context.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;

        if (shouldClose)
            await connection.OpenAsync(cancellationToken);

        try
        {
            await using var command = connection.CreateCommand();
            // F9.7a: identificadores entre comillas dobles (Postgres crea "AspNetUserRoles"
            // y "AspNetRoles"; sin comillas las resuelve en minúsculas -> 42P01).
            command.CommandText =
                "SELECT ur.\"UserId\", r.\"Name\" FROM \"AspNetUserRoles\" ur " +
                "INNER JOIN \"AspNetRoles\" r ON ur.\"RoleId\" = r.\"Id\"";

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                if (reader.IsDBNull(0) || reader.IsDBNull(1))
                    continue;

                // En SQLite los Guid se guardan como TEXT en minúsculas.
                if (!Guid.TryParse(Convert.ToString(reader.GetValue(0)), out var userId))
                    continue;

                var roleName = Convert.ToString(reader.GetValue(1));
                if (!string.IsNullOrWhiteSpace(roleName) && !map.ContainsKey(userId))
                    map[userId] = roleName!;
            }
        }
        finally
        {
            if (shouldClose)
                await connection.CloseAsync();
        }

        return map;
    }

    /// <summary>Comprueba que el rol exista en AspNetRoles (los crea /api/setup/init-roles).</summary>
    private static async Task<bool> RoleExistsAsync(
        ApplicationDbContext context,
        string roleName,
        CancellationToken cancellationToken)
    {
        // EF Core 8 exige el alias "Value" para SqlQueryRaw escalar.
        // F9.7a: identificadores entre comillas dobles (Postgres) y CAST a INTEGER porque
        // COUNT(*) devuelve bigint en Postgres y leerlo como int lanzaría InvalidCastException.
        var count = await context.Database
            .SqlQueryRaw<int>(
                "SELECT CAST(COUNT(*) AS INTEGER) AS \"Value\" " +
                "FROM \"AspNetRoles\" WHERE UPPER(\"Name\") = UPPER({0})",
                roleName)
            .SingleAsync(cancellationToken);

        return count > 0;
    }

    /// <summary>Reemplaza el rol del usuario: borra sus filas de AspNetUserRoles e inserta la nueva.</summary>
    private static async Task SetUserRoleAsync(
        ApplicationDbContext context,
        Guid userId,
        string roleName,
        CancellationToken cancellationToken)
    {
        // F9.7a: identificadores entre comillas dobles (Postgres crea "AspNetUserRoles" y
        // "AspNetRoles"; sin comillas -> 42P01). El Guid viaja como texto en minúsculas y la
        // columna se castea a TEXT porque en Postgres UserId es uuid (LOWER(uuid) -> 42883).
        await context.Database.ExecuteSqlRawAsync(
            "DELETE FROM \"AspNetUserRoles\" " +
            "WHERE LOWER(CAST(\"UserId\" AS TEXT)) = LOWER({0})",
            new object[] { userId.ToString() },
            cancellationToken);

        // F9.1/F9.7a: el INSERT sí depende del proveedor porque el tipo de UserId cambia
        // (uuid en Postgres, TEXT en SQLite) y no existe un cast común para ambos.
        var isPostgres = context.Database.ProviderName?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true;

        if (isPostgres)
        {
            await context.Database.ExecuteSqlRawAsync(
                "INSERT INTO \"AspNetUserRoles\" (\"UserId\", \"RoleId\") " +
                "SELECT CAST({0} AS uuid), \"Id\" FROM \"AspNetRoles\" " +
                "WHERE UPPER(\"Name\") = UPPER({1})",
                new object[] { userId.ToString(), roleName },
                cancellationToken);

            return;
        }

        await context.Database.ExecuteSqlRawAsync(
            "INSERT INTO \"AspNetUserRoles\" (\"UserId\", \"RoleId\") " +
            "SELECT {0}, \"Id\" FROM \"AspNetRoles\" " +
            "WHERE UPPER(\"Name\") = UPPER({1})",
            new object[] { userId.ToString(), roleName },
            cancellationToken);
    }

    /// <summary>Cuenta los ADMIN con IsActive = true usando un mapa de roles ya cargado.</summary>
    private static async Task<int> CountActiveAdminsAsync(
        ApplicationDbContext context,
        Dictionary<Guid, string> rolesByUser,
        CancellationToken cancellationToken)
    {
        var adminIds = rolesByUser
            .Where(kv => string.Equals(kv.Value, AdminRole, StringComparison.OrdinalIgnoreCase))
            .Select(kv => kv.Key)
            .ToList();

        if (adminIds.Count == 0)
            return 0;

        var activeUserIds = await context.Users
            .AsNoTracking()
            .Where(u => u.IsActive)
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);

        return activeUserIds.Count(adminIds.Contains);
    }

    /// <summary>true si el usuario es ADMIN y es el único ADMIN activo del sistema.</summary>
    private static async Task<bool> IsOnlyActiveAdminAsync(
        ApplicationDbContext context,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var rolesByUser = await LoadUserRolesAsync(context, cancellationToken);

        if (!rolesByUser.TryGetValue(userId, out var role) ||
            !string.Equals(role, AdminRole, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return await CountActiveAdminsAsync(context, rolesByUser, cancellationToken) <= 1;
    }

    /// <summary>
    /// Invalida la sesión del usuario afectado (cookie con claims viejos). Se omite cuando el
    /// afectado es el propio ADMIN que ejecuta la acción, para no cerrarle la sesión en curso.
    /// </summary>
    private static async Task RefreshSecurityStampAsync(
        UserManager<User> userManager,
        User user,
        Guid currentUserId)
    {
        if (user.Id == currentUserId)
            return;

        _ = await userManager.UpdateSecurityStampAsync(user);
    }
}

public class UpdateUserRoleRequest
{
    public string Role { get; set; } = string.Empty;
}

public class UpdateUserStatusRequest
{
    public bool? IsActive { get; set; }
}
