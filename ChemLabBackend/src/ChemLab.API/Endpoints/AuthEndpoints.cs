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
                await userManager.AddToRoleAsync(user, "RESEARCHER");
                return Results.Ok(new { Message = "User created successfully" });
            }

            return Results.BadRequest(result.Errors);
        });

        group.MapPost("/login", async (LoginRequest request, SignInManager<User> signInManager, UserManager<User> userManager) =>
        {
            var result = await signInManager.PasswordSignInAsync(request.Email, request.Password, false, false);

            if (result.Succeeded)
            {
                var user = await userManager.FindByEmailAsync(request.Email);
                if (user == null)
                {
                    return Results.Unauthorized();
                }

                var roles = await userManager.GetRolesAsync(user);

                return Results.Ok(new
                {
                    Message = "Login successful",
                    User = new
                    {
                        user.Id,
                        user.Email,
                        user.FirstName,
                        user.LastName,
                        Role = roles.FirstOrDefault() ?? "RESEARCHER",
                        user.CreatedAt
                    }
                });
            }

            if (result.IsLockedOut)
                return Results.StatusCode(423);

            if (result.IsNotAllowed)
                return Results.StatusCode(403);

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
