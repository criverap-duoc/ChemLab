using ChemLab.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace ChemLab.API.Endpoints;

public static class SetupEndpoints
{
    public static void MapSetupEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/setup");

        group.MapPost("/init-roles", async (RoleManager<IdentityRole<Guid>> roleManager) =>
        {
            string[] roles = { "ADMIN", "LAB_MANAGER", "RESEARCHER", "LAB_TECH" };
            var results = new List<string>();

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole<Guid> { Name = role, NormalizedName = role.ToUpper() });
                    results.Add($"Rol {role} creado");
                }
                else
                {
                    results.Add($"Rol {role} ya existe");
                }
            }

            return Results.Ok(new { Message = "Roles inicializados", Results = results });
        });

        group.MapGet("/check", () => Results.Ok(new { Status = "Setup endpoints working" }));
    }
}
