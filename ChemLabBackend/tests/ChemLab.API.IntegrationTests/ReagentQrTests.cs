using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace ChemLab.API.IntegrationTests;

/// <summary>
/// F10.3: búsqueda de reactivos a través del contenido de un QR.
/// GET /api/reagents/by-qr/{code} resuelve por Id (Guid), CAS exacto o nombre parcial.
/// </summary>
public sealed class ReagentQrTests : IClassFixture<ChemLabApiFactory>, IDisposable
{
    private const string Password = "ChemLab123!";

    private readonly HttpClient _client;
    // Cada test de la clase comparte la misma BD temporal (IClassFixture), así que el
    // email es único por instancia para que el registro no choque entre pruebas.
    private readonly string _email = $"reagent.qr.{Guid.NewGuid():N}@chemlab.com";

    public ReagentQrTests(ChemLabApiFactory factory)
    {
        factory.EnsureDatabaseCreated();

        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    [Fact]
    public async Task GetByQr_WithValidId_ReturnsReagent()
    {
        await EnsureAuthenticatedAsync();

        // Arrange: el QR generado por el frontend codifica el Id del reactivo.
        var reagentId = await CreateReagentAsync("Reactivo QR", "64-17-5");

        // Act
        var response = await _client.GetAsync($"/api/reagents/by-qr/{reagentId}");

        // Assert
        var body = await response.Content.ReadAsStringAsync();
        Assert.True(
            response.StatusCode == HttpStatusCode.OK,
            $"El GET by-qr devolvió {(int)response.StatusCode}: {body}");

        using var reagent = JsonDocument.Parse(body);
        var root = reagent.RootElement;

        Assert.Equal(reagentId, root.GetProperty("id").GetGuid());
        Assert.Equal("Reactivo QR", root.GetProperty("name").GetString());
        Assert.Equal("64-17-5", root.GetProperty("casNumber").GetString());
    }

    [Fact]
    public async Task GetByQr_WithInvalidCode_Returns404()
    {
        await EnsureAuthenticatedAsync();

        // Act: código que no es Guid, ni CAS, ni parte de ningún nombre.
        var response = await _client.GetAsync("/api/reagents/by-qr/qr-invalido-f10-3");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    public void Dispose() => _client.Dispose();

    private async Task EnsureAuthenticatedAsync()
    {
        // Los roles deben existir antes de registrar: /api/auth/register asigna RESEARCHER.
        var roles = await _client.PostAsync("/api/setup/init-roles", null);
        Assert.True(roles.IsSuccessStatusCode, "No se pudieron inicializar los roles");

        var register = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email = _email,
            password = Password,
            firstName = "Test",
            lastName = "QR"
        });
        var registerBody = await register.Content.ReadAsStringAsync();
        Assert.True(
            register.IsSuccessStatusCode,
            $"Registro falló ({(int)register.StatusCode}): {registerBody}");

        var login = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = _email,
            password = Password
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }

    private async Task<Guid> CreateReagentAsync(string name, string casNumber)
    {
        var response = await _client.PostAsJsonAsync("/api/reagents", new
        {
            name,
            chemicalFormula = "C2H6O",
            casNumber,
            quantity = 500m,
            unit = "mL",
            location = "Vitrina QR",
            hazardLevel = "Moderate",
            minQuantity = 5m
        });

        var body = await response.Content.ReadAsStringAsync();
        Assert.True(
            response.StatusCode == HttpStatusCode.Created,
            $"El POST de reactivo devolvió {(int)response.StatusCode}: {body}");

        var payload = await response.Content.ReadFromJsonAsync<IdResponse>();
        Assert.NotNull(payload);
        return payload!.Id;
    }

    private sealed class IdResponse
    {
        public Guid Id { get; set; }
    }
}
