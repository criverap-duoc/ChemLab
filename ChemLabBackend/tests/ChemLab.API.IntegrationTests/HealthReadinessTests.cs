using System.Net;
using ChemLab.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ChemLab.API.IntegrationTests;

/// <summary>
/// F11.2: readiness probe GET /api/health/ready. A diferencia de /api/health (liveness,
/// siempre 200), este endpoint usa AddDbContextCheck&lt;ApplicationDbContext&gt; y por tanto
/// devuelve 503 cuando la BD no responde (p. ej. Supabase pausado).
/// </summary>
public sealed class HealthReadinessTests : IClassFixture<ChemLabApiFactory>
{
    private readonly ChemLabApiFactory _factory;

    public HealthReadinessTests(ChemLabApiFactory factory)
    {
        _factory = factory;
        factory.EnsureDatabaseCreated();
    }

    [Fact]
    public async Task Readiness_WithDatabaseAvailable_Returns200Healthy()
    {
        // Arrange: la BD SQLite temporal existe (EnsureDatabaseCreated).
        using var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/health/ready");
        var body = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", body);
    }

    [Fact]
    public async Task Readiness_WithUnreachableDatabase_Returns503Unhealthy()
    {
        // Arrange: se re-registra el DbContext apuntando a un directorio inexistente,
        // así SQLite no puede abrir el archivo y CanConnectAsync falla.
        var unreachablePath = Path.Combine(
            Path.GetTempPath(),
            $"chemlab-no-existe-{Guid.NewGuid():N}",
            "chemlab.db");

        using var brokenFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<ApplicationDbContext>();
                services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseSqlite($"Data Source={unreachablePath}"));
            });
        });

        using var client = brokenFactory.CreateClient();

        // Act
        var readiness = await client.GetAsync("/api/health/ready");
        var liveness = await client.GetAsync("/api/health");

        // Assert: readiness falla, pero el liveness sigue respondiendo 200.
        Assert.Equal(HttpStatusCode.ServiceUnavailable, readiness.StatusCode);
        Assert.Equal("Unhealthy", await readiness.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.OK, liveness.StatusCode);
    }
}
