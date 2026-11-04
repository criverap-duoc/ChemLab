using ChemLab.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace ChemLab.API.IntegrationTests;

/// <summary>
/// F10.1: fábrica de la API real con una base SQLite aislada por ejecución.
///
/// No se toca el código de producción: se reescribe la connection string vía
/// configuración (Infrastructure la lee dentro del lambda diferido de AddDbContext,
/// así que el valor ya está aplicado cuando se resuelve el primer DbContext) y se
/// apunta a un archivo temporal absoluto, porque Infrastructure normaliza las rutas
/// relativas contra el ContentRoot.
/// </summary>
public sealed class ChemLabApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databasePath =
        Path.Combine(Path.GetTempPath(), $"chemlab-tests-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={_databasePath}"
            });
        });

        builder.ConfigureServices(services =>
        {
            // NotificationBackgroundService lanza consultas periódicas contra la BD:
            // no aporta nada en tests y complica el ciclo de vida del host.
            services.RemoveAll<IHostedService>();
        });
    }

    /// <summary>Crea el esquema (Identity + inventario) en la BD temporal de test.</summary>
    public void EnsureDatabaseCreated()
    {
        using var scope = Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        context.Database.EnsureCreated();
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (!disposing)
            return;

        try
        {
            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();

            if (File.Exists(_databasePath))
                File.Delete(_databasePath);
        }
        catch (IOException)
        {
            // El archivo temporal lo limpia el runner; un fallo aquí no debe romper el test.
        }
        catch (UnauthorizedAccessException)
        {
        }
    }
}
