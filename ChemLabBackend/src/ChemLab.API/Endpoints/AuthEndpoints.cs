using ChemLab.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

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

        group.MapPost("/login", async (LoginRequest request, SignInManager<User> signInManager, UserManager<User> userManager) =>
        {
            // Validar datos de entrada
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                return Results.BadRequest(new { Error = "Email y contraseña son requeridos" });

            var result = await signInManager.PasswordSignInAsync(request.Email, request.Password, false, false);

            if (result.Succeeded)
            {
                var user = await userManager.FindByEmailAsync(request.Email);
                if (user == null)
                    return Results.Unauthorized();

                // 🔥 FORZAR LA RECARGA DEL USUARIO DESDE LA BD
                await userManager.UpdateSecurityStampAsync(user);

                // Volver a firmar al usuario con los claims actualizados
                await signInManager.SignOutAsync();
                await signInManager.SignInAsync(user, isPersistent: false);

                // Obtener roles actualizados
                var roles = await userManager.GetRolesAsync(user);

                Console.WriteLine($"========== LOGIN DEBUG ==========");
                Console.WriteLine($"Usuario: {user.Email}");
                Console.WriteLine($"Roles encontrados en BD: {string.Join(", ", roles)}");
                Console.WriteLine($"==================================");

                // Determinar el rol (usar el de BD o forzar por email)
                string userRole = roles.FirstOrDefault() ?? "RESEARCHER";

                return Results.Ok(new
                {
                    Message = "Login successful",
                    User = new
                    {
                        user.Id,
                        user.Email,
                        user.FirstName,
                        user.LastName,
                        Role = userRole,
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
