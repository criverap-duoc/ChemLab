using ChemLab.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ChemLab.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // F6.5d: la connection string SIEMPRE se lee de IConfiguration (ruta absoluta).
        // Antes estaba hardcodeada como "Data Source=chemlab.db", así que SQLite resolvía
        // la ruta contra el CWD del proceso (p.ej. bin\Debug\net8.0) y abría otra BD vacía.
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Falta la connection string 'DefaultConnection' en la configuración (appsettings.json).");
        }

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            // F6.5f: se normaliza el DataSource a RUTA ABSOLUTA antes de abrir la conexión.
            // Si la cadena trae una ruta relativa, SQLite la resolvería contra el CWD del
            // proceso (p.ej. bin\Debug\net8.0) y abriría OTRO archivo .db vacío.
            var csb = new Microsoft.Data.Sqlite.SqliteConnectionStringBuilder(connectionString);
            var absolutePath = System.IO.Path.IsPathRooted(csb.DataSource)
                ? csb.DataSource
                : System.IO.Path.GetFullPath(csb.DataSource, AppContext.BaseDirectory);
            Console.WriteLine($"[DI] DataSource absoluto: {absolutePath}");
            csb.DataSource = absolutePath;
            options.UseSqlite(csb.ToString());
        });

        return services;
    }
}