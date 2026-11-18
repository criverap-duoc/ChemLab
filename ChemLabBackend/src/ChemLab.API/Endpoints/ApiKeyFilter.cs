// ChemLabBackend\src\ChemLab.API\Endpoints\ApiKeyFilter.cs
using System.Security.Cryptography;
using System.Text;

namespace ChemLab.API.Endpoints;

/// <summary>
/// F11.1: filtro de API key para los endpoints públicos (/api/public/*).
///
/// Aislado del esquema de autenticación de Identity: no usa cookies, ni JWT, ni roles.
/// La clave se lee de configuración (PublicApi:ApiKey) y se compara contra el header
/// X-Api-Key en tiempo constante. NUNCA se registra la clave configurada ni el header.
/// </summary>
public sealed class ApiKeyFilter : IEndpointFilter
{
    private const string ApiKeyHeader = "X-Api-Key";
    private const string ApiKeyConfigurationKey = "PublicApi:ApiKey";

    private readonly IConfiguration _configuration;

    public ApiKeyFilter(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var configuredKey = _configuration[ApiKeyConfigurationKey];

        // Sin clave configurada la API pública queda deshabilitada (no se abre por defecto).
        if (string.IsNullOrWhiteSpace(configuredKey))
        {
            return Results.Json(
                new { Message = "API pública no configurada." },
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        var providedKey = context.HttpContext.Request.Headers[ApiKeyHeader].ToString();

        if (string.IsNullOrWhiteSpace(providedKey) ||
            !FixedTimeEquals(providedKey.Trim(), configuredKey.Trim()))
        {
            // Mensaje genérico: no se distingue entre "ausente" e "inválida".
            return Results.Json(
                new { Message = "API key inválida o ausente." },
                statusCode: StatusCodes.Status401Unauthorized);
        }

        return await next(context);
    }

    /// <summary>
    /// Comparación ordinal en tiempo constante. FixedTimeEquals exige longitudes iguales
    /// (devuelve false sin recorrer el buffer cuando difieren).
    /// </summary>
    private static bool FixedTimeEquals(string provided, string expected)
    {
        var providedBytes = Encoding.UTF8.GetBytes(provided);
        var expectedBytes = Encoding.UTF8.GetBytes(expected);

        return CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes);
    }
}
