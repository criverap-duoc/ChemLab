using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace ChemLab.API.IntegrationTests;

/// <summary>
/// F10.1: smoke tests de la API real (pipeline completo: CORS, autenticación por cookie,
/// AuditMiddleware y Minimal APIs) contra una base SQLite temporal.
/// </summary>
public sealed class AuthIntegrationTests : IClassFixture<ChemLabApiFactory>, IDisposable
{
    private readonly HttpClient _client;

    public AuthIntegrationTests(ChemLabApiFactory factory)
    {
        factory.EnsureDatabaseCreated();

        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    [Fact]
    public async Task HealthCheck_Returns200()
    {
        // Act
        var response = await _client.GetAsync("/api/health");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<HealthResponse>();
        Assert.NotNull(payload);
        Assert.Equal("Healthy", payload!.Status);
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_Returns401()
    {
        // Act: usuario que no existe en la BD de test (FindByEmailAsync devuelve null).
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "nadie@chemlab.com",
            password = "Password123!"
        });

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    public void Dispose() => _client.Dispose();

    private sealed class HealthResponse
    {
        public string? Status { get; set; }
    }
}
