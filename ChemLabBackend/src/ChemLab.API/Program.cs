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
using ChemLab.API.Middleware;

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
// F6.5c: CRÍTICO - registrar el RoleStore de EF Core. Sin esta línea Identity
// puede quedar con UserOnlyStore y GetRolesAsync() devuelve vacío.
.AddRoles<IdentityRole<Guid>>()
// Debe ir DESPUÉS de AddRoles para que el store se construya con el TRole correcto.
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configurar autenticación COOKIES para API (evitar redirecciones)
// F7b: frontend (localhost:3000) y API (localhost:5000) son el MISMO sitio pero
// distinto origen. En dev no hay HTTPS, así que la cookie debe poder viajar por
// http con SameSite=Lax (los puertos no cuentan para "same-site").
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = ".AspNetCore.Identity.Application";
    options.Cookie.HttpOnly = true;
    options.Cookie.Path = "/";

    // F9.2: cualquier entorno != Production (Development, Postgres, Staging...) es local/http,
    // así que la cookie debe viajar con SameSite=Lax y sin Secure. Antes solo se cubría
    // Development, y con ASPNETCORE_ENVIRONMENT=Postgres se activaba Secure=Always (cookie
    // descartada por el navegador/curl sobre http) y el login parecía fallar.
    if (!builder.Environment.IsProduction())
    {
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.None;
    }
    else
    {
        // Producción (frontend y API en dominios distintos): cookie cross-site.
        options.Cookie.SameSite = SameSiteMode.None;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    }

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
builder.Services.AddAuthorization(options =>
{
    // F8.2: policy exclusiva de la gestión de usuarios (/api/users). El claim de rol viaja
    // en la cookie porque AddRoles<IdentityRole<Guid>>() está registrado (F6.5c).
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("ADMIN"));
});

builder.Services.AddHttpContextAccessor();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        // F9.4: los orígenes permitidos se leen de configuración ("AllowedOrigins"), así el
        // dominio del frontend se cambia desde el dashboard/env sin recompilar la imagen.
        // Render inyecta el array como variables de entorno: AllowedOrigins__0, __1, ...
        var configuredOrigins = builder.Configuration
            .GetSection("AllowedOrigins")
            .Get<string[]>()?
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .ToArray() ?? [];

        // F9.2: fuera de Production (Development, Postgres, Staging) se aceptan los dos
        // orígenes locales: el frontend (3000) y la propia API servida en 5000 (Smoke tests
        // / Swagger / SignalR desde el navegador). En Production, si no hay nada configurado,
        // no se habilita CORS cruzado (no se cae a localhost).
        var allowedOrigins = configuredOrigins.Length > 0
            ? configuredOrigins
            : builder.Environment.IsProduction()
                ? Array.Empty<string>()
                : new[] { "http://localhost:3000", "http://localhost:5000" };

        policy.WithOrigins(allowedOrigins)
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

// F6.5g: Exponer el ContentRoot a la configuración para que Infrastructure pueda
// resolver la ruta relativa de la BD contra la raíz REAL de la aplicación
// (src\ChemLab.API en `dotnet run`, carpeta de publish en deploy), en lugar del
// CWD del proceso (bin\Debug\net8.0). builder.Configuration es un
// ConfigurationManager (IConfigurationRoot), así que el indexer admite escritura.
// Se lee de forma diferida cuando EF construye el DbContext, por eso basta con
// asignarlo aquí (antes de que se resuelva cualquier DbContext).
builder.Configuration["ContentRoot"] = app.Environment.ContentRootPath;

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

// F8.1: auditoría automática de POST/PUT/PATCH/DELETE en /api/{reagents|equipment|
// experiments|requests}. Va DESPUÉS de UseAuthentication/UseAuthorization para tener
// HttpContext.User resuelto y para no auditar peticiones rechazadas (401/403).
app.UseMiddleware<AuditMiddleware>();

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
app.MapTraceabilityEndpoints();
app.MapUserEndpoints();

app.Run();
