using ChemLab.Application;
using ChemLab.Infrastructure;
using ChemLab.Infrastructure.Data;
using ChemLab.API.Endpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using ChemLab.Domain.Entities;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using ChemLab.API.Services;
using ChemLab.API.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddProblemDetails();

// Capas de la aplicación
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Identity - CONFIGURACIÓN PARA API (SIN REDIRECCIONES)
builder.Services.AddIdentity<User, IdentityRole<Guid>>(options =>
{
    // Configuración de Identity
    options.User.RequireUniqueEmail = true;
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configurar autenticación COOKIES para API (evitar redirecciones)
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Events = new CookieAuthenticationEvents
    {
        OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        },
        OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthentication();
builder.Services.AddAuthorization();

builder.Services.AddHttpContextAccessor();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

builder.Services.AddSignalR();
builder.Services.AddScoped<INotificationService, NotificationService>();

builder.Services.AddHostedService<NotificationBackgroundService>();

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler();
}

app.UseHttpsRedirection();
app.UseCors("ReactApp");
app.UseAuthentication();
app.UseAuthorization();

// Health check
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "Healthy",
    timestamp = DateTime.UtcNow,
    version = "1.0.0"
}))
.WithName("HealthCheck");

app.MapGet("/debug/hubs", () =>
{
    var endpoints = app.Services.GetRequiredService<EndpointDataSource>().Endpoints;
    var hubPaths = endpoints
        .OfType<RouteEndpoint>()
        .Where(e => e.RoutePattern.RawText?.Contains("hubs") == true)
        .Select(e => e.RoutePattern.RawText)
        .ToList();

    return Results.Ok(new {
        Message = "Hubs registrados",
        Hubs = hubPaths,
        TotalEndpoints = endpoints.Count()
    });
});
// Endpoints
app.MapAuthEndpoints();
app.MapReagentsEndpoints();
app.MapEquipmentEndpoints();
app.MapSetupEndpoints();
app.MapExperimentEndpoints();
app.MapRequestEndpoints();
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapTestEndpoints();
app.MapDebugEndpoints();
app.MapNotificationEndpoints();

app.Run();
