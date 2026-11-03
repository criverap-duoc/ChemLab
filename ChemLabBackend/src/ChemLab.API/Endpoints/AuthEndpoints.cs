using ChemLab.Domain.Entities;
using ChemLab.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChemLab.API.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/register", async (RegisterRequest request, UserManager<User> userManager) =>
        {
            // Validar datos de entrada
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                return Results.BadRequest(new { Error = "Email y contraseña son requeridos" });

            var user = new User
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            var result = await userManager.CreateAsync(user, request.Password);

            if (result.Succeeded)
            {
                // Asignar rol por defecto
                await userManager.AddToRoleAsync(user, "RESEARCHER");

                return Results.Ok(new { Message = "Usuario creado exitosamente" });
            }

            return Results.BadRequest(result.Errors);
        });

        group.MapPost("/login", async (LoginRequest request, SignInManager<User> signInManager, UserManager<User> userManager, ApplicationDbContext context, ILoggerFactory loggerFactory) =>
        {
            // Validar datos de entrada
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                return Results.BadRequest(new { Error = "Email y contraseña son requeridos" });

            // F8.4: rechazar usuarios inexistentes o desactivados ANTES de validar credenciales.
            // Un usuario con IsActive = false no debe poder iniciar sesión aunque su
            // contraseña sea correcta (bug de seguridad detectado en la auditoría F8).
            var user = await userManager.FindByEmailAsync(request.Email);
            if (user == null || !user.IsActive)
                return Results.Unauthorized();

            var result = await signInManager.PasswordSignInAsync(request.Email, request.Password, false, false);

            if (result.Succeeded)
            {
                // F6.5f: los roles se leen con SQL CRUDO sobre la MISMA conexión de EF Core.
                // Identity/UserManager.GetRolesAsync() devolvía vacío con este modelo
                // (Guid + converter), así que el rol se resuelve aquí directamente.
                // OJO EF Core 8: SqlQueryRaw<T> escalar exige que la columna se llame "Value".
                //
                // F9.7a: los identificadores van entre COMILLAS DOBLES. Postgres crea las
                // tablas como "AspNetUserRoles"/"AspNetRoles" (PascalCase); sin comillas las
                // baja a minúsculas y responde 42P01 "relation aspnetuserroles does not exist"
                // (ese fallo caía en el catch y producía el rol RESEARCHER por defecto).
                // El Guid se envía como texto en minúsculas ({0}) y la columna se castea a TEXT:
                // en SQLite UserId es TEXT en minúsculas (GuidToStringConverter) y en Postgres
                // es uuid, donde LOWER(uuid) no existe y daría 42883. CAST(... AS TEXT) es
                // válido en ambos motores, igual que las comillas dobles.
                var userId = user.Id;
                List<string> roleNames;
                try
                {
                    roleNames = await context.Database
                        .SqlQueryRaw<string>(
                            "SELECT r.\"Name\" AS \"Value\" " +
                            "FROM \"AspNetUserRoles\" ur " +
                            "JOIN \"AspNetRoles\" r ON ur.\"RoleId\" = r.\"Id\" " +
                            "WHERE LOWER(CAST(ur.\"UserId\" AS TEXT)) = LOWER({0})",
                            userId.ToString())
                        .ToListAsync();
                }
                catch (Exception ex)
                {
                    // Fallback: si el SQL falla, el usuario entra como RESEARCHER.
                    // F9.7a: el fallo ya no es silencioso (antes ocultó el 42P01 en Render).
                    loggerFactory.CreateLogger("ChemLab.API.Auth")
                        .LogError(ex, "No se pudieron leer los roles del usuario {UserId}; se aplica el fallback RESEARCHER.", userId);
                    roleNames = new List<string>();
                }

                // Refrescar el security stamp y re-firmar con los claims actualizados
                // (se mantiene igual que antes: no forma parte del bloque de roles).
                await userManager.UpdateSecurityStampAsync(user);
                await signInManager.SignOutAsync();
                await signInManager.SignInAsync(user, isPersistent: false);

                var assignedRole = roleNames.FirstOrDefault() ?? "RESEARCHER";

                return Results.Ok(new
                {
                    Message = "Login successful",
                    User = new
                    {
                        user.Id,
                        user.Email,
                        user.FirstName,
                        user.LastName,
                        Role = assignedRole,
                        user.CreatedAt
                    }
                });
            }

            return Results.Unauthorized();
        });

        group.MapPost("/logout", async (SignInManager<User> signInManager) =>
        {
            await signInManager.SignOutAsync();
            return Results.Ok(new { Message = "Logout successful" });
        });
    }
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
