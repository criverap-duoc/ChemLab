using System.Net;
using System.Text.Json;
using ChemLab.Domain.Entities;
using ChemLab.Domain.Enums;
using ChemLab.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ChemLab.API.IntegrationTests;

/// <summary>
/// F11.1: endpoint público de solo lectura GET /api/public/inventory (integración con
/// QuimioResponde). El control de acceso es la API key del header X-Api-Key; no se usa
/// cookie, JWT ni rol. La BD es la SQLite temporal de <see cref="ChemLabApiFactory"/> y se
/// siembra una vez por clase (IClassFixture) con los 5 reactivos que cubren los filtros.
/// </summary>
public sealed class PublicInventoryTests : IClassFixture<ChemLabApiFactory>, IDisposable
{
    private const string ApiKey = "test-public-key-f11-1";

    // Ids fijos: el seed se ejecuta una sola vez aunque xUnit cree una instancia por test.
    private static readonly Guid ExpiringId = Guid.Parse("11111111-1111-1111-1111-111111111101");
    private static readonly Guid ExpiredId = Guid.Parse("11111111-1111-1111-1111-111111111102");
    private static readonly Guid TodayId = Guid.Parse("11111111-1111-1111-1111-111111111103");
    private static readonly Guid NoExpiryId = Guid.Parse("11111111-1111-1111-1111-111111111104");
    private static readonly Guid InactiveId = Guid.Parse("11111111-1111-1111-1111-111111111105");
    private static readonly Guid OwnerId = Guid.Parse("22222222-2222-2222-2222-222222222201");

    private const string ExpiringName = "Etanol Público F11.1";
    private const string ExpiredName = "Reactivo Vencido F11.1";
    private const string TodayName = "Reactivo Vence Hoy F11.1";
    private const string NoExpiryName = "Reactivo Sin Vencimiento F11.1";
    private const string InactiveName = "Reactivo Inactivo F11.1";

    private readonly ChemLabApiFactory _factory;
    private readonly WebApplicationFactory<Program> _publicFactory;
    private readonly HttpClient _client;

    public PublicInventoryTests(ChemLabApiFactory factory)
    {
        _factory = factory;
        factory.EnsureDatabaseCreated();

        // La clave se inyecta por configuración en memoria: nunca se versiona una clave real.
        _publicFactory = factory.WithWebHostBuilder(builder =>
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["PublicApi:ApiKey"] = ApiKey
                });
            }));

        _client = _publicFactory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        SeedInventory();
    }

    [Fact]
    public async Task WithoutApiKey_Returns401()
    {
        // Act: sin header X-Api-Key.
        var response = await _client.GetAsync("/api/public/inventory");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task WithInvalidApiKey_Returns401()
    {
        // Act
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/public/inventory");
        request.Headers.TryAddWithoutValidation("X-Api-Key", "clave-invalida-f11-1");

        var response = await _client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task WithValidApiKey_ReturnsPaginatedInventory()
    {
        // Act: sin filtros. De los 5 reactivos del seed, 4 están activos (el quinto es baja lógica).
        using var firstPage = await GetInventoryAsync();
        var root = firstPage.RootElement;

        // Assert
        Assert.Equal(1, root.GetProperty("page").GetInt32());
        Assert.Equal(20, root.GetProperty("pageSize").GetInt32());
        Assert.Equal(4, root.GetProperty("totalCount").GetInt32());
        Assert.Equal(1, root.GetProperty("totalPages").GetInt32());
        Assert.Equal(4, root.GetProperty("data").GetArrayLength());

        // Segunda página de 2 elementos sobre 4 totales → 2 páginas.
        using var secondPage = await GetInventoryAsync("?page=2&pageSize=2");
        var second = secondPage.RootElement;

        Assert.Equal(2, second.GetProperty("page").GetInt32());
        Assert.Equal(2, second.GetProperty("pageSize").GetInt32());
        Assert.Equal(2, second.GetProperty("data").GetArrayLength());
        Assert.Equal(4, second.GetProperty("totalCount").GetInt32());
        Assert.Equal(2, second.GetProperty("totalPages").GetInt32());
    }

    [Fact]
    public async Task ExpiringInDays_ReturnsOnlyReagentsInsideWindow()
    {
        // Act
        using var doc = await GetInventoryAsync("?expiringInDays=30&pageSize=100");
        var root = doc.RootElement;
        var ids = Ids(root);
        var limit = DateTime.UtcNow.AddDays(30);

        // Assert: entra lo que vence en 10 días y en 2 horas; queda fuera lo que no tiene
        // fecha de vencimiento.
        Assert.Contains(ExpiringId, ids);
        Assert.Contains(TodayId, ids);
        Assert.DoesNotContain(NoExpiryId, ids);

        foreach (var item in root.GetProperty("data").EnumerateArray())
        {
            Assert.True(
                item.GetProperty("expiryDate").GetDateTime() <= limit,
                $"El reactivo {item.GetProperty("name").GetString()} vence fuera de la ventana de 30 días");
        }
    }

    [Fact]
    public async Task Expired_ReturnsOnlyExpiredReagents()
    {
        // Act
        using var doc = await GetInventoryAsync("?expired=true&pageSize=100");
        var root = doc.RootElement;

        // Assert
        Assert.Equal(new[] { ExpiredId }, Ids(root));

        foreach (var item in root.GetProperty("data").EnumerateArray())
        {
            Assert.True(item.GetProperty("isExpired").GetBoolean());
            Assert.True(item.GetProperty("expiryDate").GetDateTime() < DateTime.UtcNow);
        }
    }

    [Fact]
    public async Task HazardLevelFilter_ReturnsOnlyThatLevel()
    {
        // Act: nivel 3 = High. El reactivo inactivo también es High, pero no es visible.
        using var doc = await GetInventoryAsync("?hazardLevel=3&pageSize=100");
        var root = doc.RootElement;

        // Assert
        Assert.Equal(new[] { ExpiringId }, Ids(root));

        foreach (var item in root.GetProperty("data").EnumerateArray())
        {
            Assert.Equal(3, item.GetProperty("hazardLevel").GetInt32());
        }
    }

    [Fact]
    public async Task CasNumberFilter_ReturnsExactMatch()
    {
        // Act
        using var doc = await GetInventoryAsync("?casNumber=7732-18-5&pageSize=100");
        var root = doc.RootElement;

        // Assert
        Assert.Equal(new[] { ExpiredId }, Ids(root));
        Assert.Equal("7732-18-5", root.GetProperty("data")[0].GetProperty("casNumber").GetString());
    }

    /// <summary>
    /// Regresión F11.1b: combinación de filtros usada por QuimioResponde en producción
    /// (expiringInDays + hazardLevel + location) debe devolver el reactivo correcto y
    /// llegar al SQL con `ORDER BY` portable (sin `COALESCE(..., DateTime.MaxValue)`).
    /// </summary>
    [Fact]
    public async Task CombinedFilters_ExpiringHazardAndLocation_ReturnsMatch()
    {
        // Act: ventana de 30 días + nivel 3 (High) + ubicación parcial en minúsculas.
        using var doc = await GetInventoryAsync("?expiringInDays=30&hazardLevel=3&location=estante&pageSize=100");
        var root = doc.RootElement;

        // Assert: solo el reactivo High dentro de la ventana y en la ubicación indicada.
        Assert.Equal(new[] { ExpiringId }, Ids(root));
        Assert.Equal(1, root.GetProperty("totalCount").GetInt32());
        Assert.Equal(ExpiringName, root.GetProperty("data")[0].GetProperty("name").GetString());
    }

    /// <summary>
    /// Regresión F11.1b: el reactivo sin fecha de vencimiento se ordena al final y el orden
    /// por vencimiento ascendente se mantiene tras sustituir `DateTime.MaxValue` por un
    /// predicado booleano (portable entre SQLite y PostgreSQL).
    /// </summary>
    [Fact]
    public async Task DefaultOrder_PlacesReagentsWithoutExpiryLast()
    {
        // Act
        using var doc = await GetInventoryAsync("?pageSize=100");
        var root = doc.RootElement;
        var ids = Ids(root);

        // Assert: primero el vencido, después los próximos a vencer y al final el sin fecha.
        Assert.Equal(4, ids.Count);
        Assert.Equal(ExpiredId, ids[0]);
        Assert.Equal(TodayId, ids[1]);
        Assert.Equal(ExpiringId, ids[2]);
        Assert.Equal(NoExpiryId, ids[3]);
    }

    [Fact]
    public async Task DaysUntilExpiry_IsPositiveZeroAndNegative()
    {
        // Act
        using var doc = await GetInventoryAsync("?pageSize=100");
        var root = doc.RootElement;

        var expiring = FindById(root, ExpiringId);
        var today = FindById(root, TodayId);
        var expired = FindById(root, ExpiredId);
        var noExpiry = FindById(root, NoExpiryId);

        // Assert: positivo (futuro), cero (vence hoy), negativo (vencido) y null (sin fecha).
        Assert.True(expiring.GetProperty("daysUntilExpiry").GetInt32() > 0);
        Assert.Equal(0, today.GetProperty("daysUntilExpiry").GetInt32());
        Assert.True(expired.GetProperty("daysUntilExpiry").GetInt32() < 0);
        Assert.Equal(JsonValueKind.Null, noExpiry.GetProperty("daysUntilExpiry").ValueKind);

        Assert.False(today.GetProperty("isExpired").GetBoolean());
        Assert.True(expired.GetProperty("isExpired").GetBoolean());

        // isLowStock: 5 <= 10 (vencido) y 500 > 100 (normal).
        Assert.True(expired.GetProperty("isLowStock").GetBoolean());
        Assert.False(expiring.GetProperty("isLowStock").GetBoolean());
    }

    [Fact]
    public async Task InactiveReagent_IsNotExposed()
    {
        // Act
        using var doc = await GetInventoryAsync("?pageSize=100");
        var root = doc.RootElement;

        // Assert
        Assert.DoesNotContain(InactiveId, Ids(root));

        var names = root.GetProperty("data").EnumerateArray()
            .Select(e => e.GetProperty("name").GetString())
            .ToList();

        Assert.DoesNotContain(InactiveName, names);
    }

    public void Dispose()
    {
        _client.Dispose();
        _publicFactory.Dispose();
    }

    private async Task<JsonDocument> GetInventoryAsync(string query = "")
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/public/inventory" + query);
        request.Headers.TryAddWithoutValidation("X-Api-Key", ApiKey);

        var response = await _client.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        Assert.True(
            response.StatusCode == HttpStatusCode.OK,
            $"El GET público devolvió {(int)response.StatusCode}: {body}");

        return JsonDocument.Parse(body);
    }

    private static List<Guid> Ids(JsonElement root) =>
        root.GetProperty("data").EnumerateArray()
            .Select(e => e.GetProperty("id").GetGuid())
            .ToList();

    private static JsonElement FindById(JsonElement root, Guid id) =>
        root.GetProperty("data").EnumerateArray()
            .Single(e => e.GetProperty("id").GetGuid() == id);

    /// <summary>
    /// Seed mínimo e idempotente: 5 reactivos que cubren vencimiento futuro, vencido, que
    /// vence hoy, sin fecha y dado de baja lógica. Reagent.CreatedById es obligatorio, así
    /// que se crea un usuario semilla que nunca se expone en la API pública.
    /// </summary>
    private void SeedInventory()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        if (context.Reagents.Any(r => r.Name == ExpiringName))
            return;

        var now = DateTime.UtcNow;

        context.Users.Add(new User
        {
            Id = OwnerId,
            UserName = "public.api.seed@chemlab.com",
            NormalizedUserName = "PUBLIC.API.SEED@CHEMLAB.COM",
            Email = "public.api.seed@chemlab.com",
            NormalizedEmail = "PUBLIC.API.SEED@CHEMLAB.COM",
            EmailConfirmed = true,
            FirstName = "Seed",
            LastName = "API pública",
            IsActive = true,
            SecurityStamp = Guid.NewGuid().ToString()
        });

        context.Reagents.AddRange(
            new Reagent
            {
                Id = ExpiringId,
                Name = ExpiringName,
                ChemicalFormula = "C2H6O",
                CasNumber = "64-17-5",
                Quantity = 500m,
                Unit = "mL",
                Location = "Estante Público A",
                HazardLevel = HazardLevel.High,
                ExpiryDate = now.AddDays(10),
                MinQuantity = 100m,
                IsActive = true,
                CreatedById = OwnerId
            },
            new Reagent
            {
                Id = ExpiredId,
                Name = ExpiredName,
                ChemicalFormula = "C3H6O",
                CasNumber = "7732-18-5",
                Quantity = 5m,
                Unit = "mL",
                Location = "Estante Público B",
                HazardLevel = HazardLevel.Low,
                ExpiryDate = now.AddDays(-5),
                MinQuantity = 10m,
                IsActive = true,
                CreatedById = OwnerId
            },
            new Reagent
            {
                Id = TodayId,
                Name = TodayName,
                ChemicalFormula = "C3H6O",
                CasNumber = "67-64-1",
                Quantity = 20m,
                Unit = "mL",
                Location = "Estante Público B",
                HazardLevel = HazardLevel.Moderate,
                ExpiryDate = now.AddHours(2),
                MinQuantity = 5m,
                IsActive = true,
                CreatedById = OwnerId
            },
            new Reagent
            {
                Id = NoExpiryId,
                Name = NoExpiryName,
                ChemicalFormula = "CH2O",
                CasNumber = "50-00-0",
                Quantity = 1000m,
                Unit = "mL",
                Location = "Estante Público C",
                HazardLevel = HazardLevel.Extreme,
                ExpiryDate = null,
                MinQuantity = 50m,
                IsActive = true,
                CreatedById = OwnerId
            },
            new Reagent
            {
                Id = InactiveId,
                Name = InactiveName,
                ChemicalFormula = "NH3",
                CasNumber = "7664-41-7",
                Quantity = 1m,
                Unit = "L",
                Location = "Estante Público D",
                HazardLevel = HazardLevel.High,
                ExpiryDate = now.AddDays(1),
                MinQuantity = 100m,
                IsActive = false,
                CreatedById = OwnerId
            });

        context.SaveChanges();
    }
}
