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
/// No se toca el código de producción: en ConfigureServices se reemplaza el registro del
/// DbContext por uno que apunta a un archivo temporal absoluto (Infrastructure normaliza
/// las rutas relativas contra el ContentRoot) y así cada ejecución tiene su propia base.
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

            // F10.2: el override de configuración NO basta. AddInfrastructure lee la
            // connection string de forma inmediata (antes de que el host de test aplique
            // sus fuentes de configuración), así que el DbContext se registra con la ruta
            // de appsettings.Development.json y los tests escribirían en la BD de
            // desarrollo (src/ChemLab.API/chemlab.db). Se re-registra apuntando al archivo
            // temporal para que cada ejecución tenga su propia base aislada.
            services.RemoveAll<ApplicationDbContext>();
            services.RemoveAll<DbContextOptions<ApplicationDbContext>>();
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlite($"Data Source={_databasePath}"));
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
