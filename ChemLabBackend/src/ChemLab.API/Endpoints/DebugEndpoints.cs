using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ChemLab.API.Endpoints;

public static class DebugEndpoints
{
    public static void MapDebugEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/debug/whoami", (HttpContext httpContext) =>
        {
            var user = httpContext.User;
            var claims = user.Claims.Select(c => new { c.Type, c.Value }).ToList();
            var roles = user.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

            return Results.Ok(new
            {
                IsAuthenticated = user.Identity?.IsAuthenticated ?? false,
                Name = user.Identity?.Name,
                Claims = claims,
                Roles = roles
            });
        }).RequireAuthorization();
    }
}
