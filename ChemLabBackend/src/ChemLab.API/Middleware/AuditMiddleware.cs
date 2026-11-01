// ChemLabBackend\src\ChemLab.API\Middleware\AuditMiddleware.cs
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using ChemLab.Domain.Entities;
using ChemLab.Infrastructure.Data;

namespace ChemLab.API.Middleware;

/// <summary>
/// F8.1: auditoría automática. Intercepta POST/PUT/PATCH/DELETE sobre los recursos
/// protegidos (/api/reagents, /api/equipment, /api/experiments, /api/requests) y,
/// cuando la respuesta es 2xx, escribe una fila en AuditLogs con la metadata de la
/// operación y el body de la request como NewValue.
///
/// Se registra DESPUÉS de UseAuthentication()/UseAuthorization() para que
/// HttpContext.User ya esté resuelto y para no auditar requests rechazadas (401/403).
/// </summary>
public class AuditMiddleware
{
    /// <summary>Límite duro del body que se guarda en NewValue (columnas TEXT de SQLite).</summary>
    private const int MaxNewValueLength = 4000;

    private const int MaxEntityIdLength = 100;
    private const int MaxUserNameLength = 200;
    private const int MaxIpAddressLength = 64;
    private const int MaxUserAgentLength = 500;

    /// <summary>Segmento de ruta (después de /api/) → EntityType esperado por TraceabilityEndpoints.</summary>
    private static readonly Dictionary<string, string> EntityTypeBySegment =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["reagents"] = "reagent",
            ["equipment"] = "equipment",
            ["experiments"] = "experiment",
            ["requests"] = "request"
        };

    private readonly RequestDelegate _next;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AuditMiddleware> _logger;

    public AuditMiddleware(
        RequestDelegate next,
        IServiceScopeFactory scopeFactory,
        ILogger<AuditMiddleware> logger)
    {
        _next = next;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var action = ResolveAction(context.Request.Method);
        var entityType = ResolveEntityType(context.Request.Path);

        // GET/HEAD/OPTIONS o rutas no auditables (p. ej. /api/auth/*, /api/notifications/*).
        if (action is null || entityType is null)
        {
            await _next(context);
            return;
        }

        var entityId = ResolveRouteId(context);

        // Se lee el body ANTES de ejecutar el endpoint (con EnableBuffering y rebobinado),
        // porque después el stream ya está consumido.
        var requestBody = await ReadRequestBodyAsync(context.Request);

        // En POST/CREATE el id no viene en la ruta: se captura de la respuesta, así que
        // hay que bufferear el body de la respuesta (JSON pequeño con { id } o el header
        // Location que genera Results.Created).
        var captureResponseBody = action == "CREATE" && string.IsNullOrEmpty(entityId);
        Stream? originalResponseBody = null;
        MemoryStream? responseBuffer = null;

        if (captureResponseBody)
        {
            originalResponseBody = context.Response.Body;
            responseBuffer = new MemoryStream();
            context.Response.Body = responseBuffer;
        }

        var completed = false;

        try
        {
            await _next(context);
            completed = true;

            if (context.Response.StatusCode is >= 200 and <= 299)
            {
                if (string.IsNullOrEmpty(entityId))
                    entityId = ResolveEntityIdFromResponse(context, responseBuffer);

                if (!string.IsNullOrEmpty(entityId))
                    await WriteAuditLogAsync(context, entityType, entityId!, action, requestBody);
            }
        }
        finally
        {
            if (responseBuffer is not null && originalResponseBody is not null)
            {
                // Restaurar SIEMPRE el stream real antes de salir (también si hubo excepción,
                // para que UseDeveloperExceptionPage/UseExceptionHandler pueda escribir).
                context.Response.Body = originalResponseBody;

                if (completed && responseBuffer.Length > 0)
                {
                    responseBuffer.Position = 0;
                    await responseBuffer.CopyToAsync(originalResponseBody);
                }

                await responseBuffer.DisposeAsync();
            }
        }
    }

    private static string? ResolveAction(string method) => method.ToUpperInvariant() switch
    {
        "POST" => "CREATE",
        "PUT" or "PATCH" => "UPDATE",
        "DELETE" => "DELETE",
        _ => null
    };

    private static string? ResolveEntityType(PathString path)
    {
        if (!path.HasValue)
            return null;

        var segments = path.Value!.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Length < 2 || !segments[0].Equals("api", StringComparison.OrdinalIgnoreCase))
            return null;

        return EntityTypeBySegment.TryGetValue(segments[1], out var entityType) ? entityType : null;
    }

    /// <summary>Id desde el segmento {id} de la ruta (PUT/PATCH/DELETE y POST anidados).</summary>
    private static string? ResolveRouteId(HttpContext context)
    {
        foreach (var key in new[] { "id", "entityId" })
        {
            if (!context.Request.RouteValues.TryGetValue(key, out var value))
                continue;

            var text = value?.ToString();
            if (!string.IsNullOrWhiteSpace(text))
                return text;
        }

        return null;
    }

    /// <summary>
    /// Id de la entidad recién creada: primero el header Location de Results.Created y,
    /// si no está, la propiedad "id" del JSON de respuesta.
    /// </summary>
    private static string? ResolveEntityIdFromResponse(HttpContext context, MemoryStream? responseBuffer)
    {
        var fromLocation = ExtractGuid(context.Response.Headers.Location.ToString());
        if (fromLocation is not null)
            return fromLocation;

        if (responseBuffer is null || responseBuffer.Length == 0 || !responseBuffer.CanRead)
            return null;

        try
        {
            responseBuffer.Position = 0;
            using var reader = new StreamReader(
                responseBuffer,
                Encoding.UTF8,
                detectEncodingFromByteOrderMarks: false,
                bufferSize: 1024,
                leaveOpen: true);

            var json = reader.ReadToEnd();
            using var document = JsonDocument.Parse(json);

            if (document.RootElement.ValueKind != JsonValueKind.Object)
                return null;

            foreach (var property in document.RootElement.EnumerateObject())
            {
                if (!property.Name.Equals("id", StringComparison.OrdinalIgnoreCase))
                    continue;

                var raw = property.Value.ValueKind switch
                {
                    JsonValueKind.String => property.Value.GetString(),
                    JsonValueKind.Object => GetNestedId(property.Value),
                    JsonValueKind.Undefined or JsonValueKind.Null => null,
                    _ => property.Value.ToString()
                };

                var candidate = ExtractGuid(raw);
                if (candidate is not null)
                    return candidate;
            }
        }
        catch (JsonException)
        {
            // Respuesta no JSON: no hay id que capturar (se omite el registro).
        }
        finally
        {
            // Rebobinar para que el volcado al stream real (finally de InvokeAsync)
            // copie la respuesta completa al cliente.
            responseBuffer.Position = 0;
        }

        return null;
    }

    private static string? GetNestedId(JsonElement element)
    {
        foreach (var property in element.EnumerateObject())
        {
            if (property.Name.Equals("id", StringComparison.OrdinalIgnoreCase))
                return property.Value.ValueKind == JsonValueKind.String
                    ? property.Value.GetString()
                    : property.Value.ToString();
        }

        return null;
    }

    /// <summary>Último segmento de la ruta que sea un GUID válido (Location: /api/reagents/{id}).</summary>
    private static string? ExtractGuid(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var segments = value.Split(new[] { '/', '?', '#' }, StringSplitOptions.RemoveEmptyEntries);
        for (var i = segments.Length - 1; i >= 0; i--)
        {
            if (Guid.TryParse(segments[i], out var guid))
                return guid.ToString();
        }

        return null;
    }

    /// <summary>
    /// Lee hasta MaxNewValueLength+1 caracteres del body y rebobina el stream para no
    /// romper el binding del endpoint. Devuelve null si no hay body legible.
    /// </summary>
    private static async Task<string?> ReadRequestBodyAsync(HttpRequest request)
    {
        if (request.ContentLength == 0)
            return null;

        try
        {
            request.EnableBuffering();

            var buffer = new char[MaxNewValueLength + 1];
            int read;

            using (var reader = new StreamReader(
                       request.Body,
                       Encoding.UTF8,
                       detectEncodingFromByteOrderMarks: false,
                       bufferSize: 1024,
                       leaveOpen: true))
            {
                read = await reader.ReadBlockAsync(buffer.AsMemory(0, buffer.Length));
            }

            return read <= 0 ? null : new string(buffer, 0, read);
        }
        catch (IOException)
        {
            return null;
        }
        finally
        {
            // El endpoint todavía tiene que leer el body: rebobinar siempre.
            if (request.Body.CanSeek)
                request.Body.Position = 0;
        }
    }

    /// <summary>
    /// NewValue: solo se guarda si el body es JSON válido y no excede el límite.
    /// En caso contrario se deja null (se guarda únicamente la metadata).
    /// </summary>
    private static string? NormalizeNewValue(string? requestBody)
    {
        if (string.IsNullOrWhiteSpace(requestBody))
            return null;

        if (requestBody.Length > MaxNewValueLength)
            return null;

        try
        {
            using var document = JsonDocument.Parse(requestBody);
            return requestBody;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private async Task WriteAuditLogAsync(
        HttpContext context,
        string entityType,
        string entityId,
        string action,
        string? requestBody)
    {
        try
        {
            var userAgent = context.Request.Headers["User-Agent"].ToString();

            var log = new AuditLog
            {
                Id = Guid.NewGuid(),
                EntityType = entityType,
                EntityId = Truncate(entityId, MaxEntityIdLength),
                Action = action,
                UserId = ResolveUserId(context.User),
                UserName = Truncate(context.User.Identity?.Name ?? "system", MaxUserNameLength),
                Timestamp = DateTime.UtcNow,
                NewValue = NormalizeNewValue(requestBody),
                IpAddress = TruncateOrNull(context.Connection.RemoteIpAddress?.ToString(), MaxIpAddressLength),
                UserAgent = TruncateOrNull(userAgent, MaxUserAgentLength)
            };

            // Scope propio: el middleware es singleton y ApplicationDbContext es scoped.
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            dbContext.AuditLogs.Add(log);
            await dbContext.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // La auditoría nunca debe romper la respuesta al cliente.
            _logger.LogWarning(
                ex,
                "F8.1: no se pudo registrar la auditoría {Action} de {EntityType}/{EntityId}",
                action,
                entityType,
                entityId);
        }
    }

    private static Guid? ResolveUserId(ClaimsPrincipal user)
    {
        var value = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(value, out var userId) ? userId : null;
    }

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];

    private static string? TruncateOrNull(string? value, int maxLength)
    {
        if (string.IsNullOrEmpty(value))
            return null;

        return Truncate(value, maxLength);
    }
}
