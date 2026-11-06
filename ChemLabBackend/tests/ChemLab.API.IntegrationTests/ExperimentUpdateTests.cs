using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace ChemLab.API.IntegrationTests;

/// <summary>
/// F10.2: regresión de la edición de experimentos. El PUT /api/experiments/{id} debe
/// reemplazar por completo las asociaciones (ExperimentReagents / ExperimentEquipment),
/// no solo los campos de texto.
/// </summary>
public sealed class ExperimentUpdateTests : IClassFixture<ChemLabApiFactory>, IDisposable
{
    private const string Email = "experiment.tester@chemlab.com";
    private const string Password = "ChemLab123!";

    private readonly HttpClient _client;

    public ExperimentUpdateTests(ChemLabApiFactory factory)
    {
        factory.EnsureDatabaseCreated();

        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    [Fact]
    public async Task UpdateExperiment_ChangesReagentsAndEquipment_ReturnsUpdatedExperiment()
    {
        await EnsureAuthenticatedAsync();

        // Arrange: 3 reactivos y 2 equipos disponibles en el inventario.
        var reagentA = await CreateReagentAsync("Reactivo A");
        var reagentB = await CreateReagentAsync("Reactivo B");
        var reagentC = await CreateReagentAsync("Reactivo C");
        var equipmentX = await CreateEquipmentAsync("Equipo X");
        var equipmentY = await CreateEquipmentAsync("Equipo Y");

        // El experimento nace con A + B y el equipo X.
        var experimentId = await CreateExperimentAsync(reagentA, reagentB, equipmentX);

        // Act: se mantiene A, se quita B y se añade C; se quita X y se usa Y.
        var updateResponse = await _client.PutAsJsonAsync($"/api/experiments/{experimentId}", new
        {
            name = "Experimento actualizado",
            description = "Descripción actualizada",
            protocol = "Protocolo actualizado",
            reagents = new[]
            {
                new { reagentId = reagentA, quantityUsed = 15.5m, unit = "mL", batchNumber = "LOTE-A2" },
                new { reagentId = reagentC, quantityUsed = 7.0m, unit = "g", batchNumber = "LOTE-C1" }
            },
            equipment = new[]
            {
                new { equipmentId = equipmentY, usageHours = 3.5d, calibrationBefore = "OK", calibrationAfter = "OK" }
            }
        });

        var updateBody = await updateResponse.Content.ReadAsStringAsync();
        Assert.True(
            updateResponse.StatusCode == HttpStatusCode.OK,
            $"El PUT devolvió {(int)updateResponse.StatusCode}: {updateBody}");

        // Assert: el GET devuelve las listas nuevas, no las heredadas del POST.
        using var experiment = await GetExperimentAsync(experimentId);
        var root = experiment.RootElement;

        Assert.Equal("Experimento actualizado", root.GetProperty("name").GetString());

        var reagentIds = root.GetProperty("reagents").EnumerateArray()
            .Select(r => r.GetProperty("reagentId").GetGuid())
            .ToList();

        Assert.Equal(2, reagentIds.Count);
        Assert.Contains(reagentA, reagentIds);
        Assert.Contains(reagentC, reagentIds);
        Assert.DoesNotContain(reagentB, reagentIds);

        var cAsociado = root.GetProperty("reagents").EnumerateArray()
            .Single(r => r.GetProperty("reagentId").GetGuid() == reagentC);
        Assert.Equal("LOTE-C1", cAsociado.GetProperty("batchNumber").GetString());
        Assert.Equal(7.0m, cAsociado.GetProperty("quantityUsed").GetDecimal());

        var equipmentIds = root.GetProperty("equipment").EnumerateArray()
            .Select(e => e.GetProperty("equipmentId").GetGuid())
            .ToList();

        Assert.Equal(new[] { equipmentY }, equipmentIds);
    }

    public void Dispose() => _client.Dispose();

    private async Task EnsureAuthenticatedAsync()
    {
        // Los roles deben existir antes de registrar: /api/auth/register asigna RESEARCHER.
        var roles = await _client.PostAsync("/api/setup/init-roles", null);
        Assert.True(roles.IsSuccessStatusCode, "No se pudieron inicializar los roles");

        var register = await _client.PostAsJsonAsync("/api/auth/register", new
        {
            email = Email,
            password = Password,
            firstName = "Test",
            lastName = "Experimentos"
        });
        var registerBody = await register.Content.ReadAsStringAsync();
        Assert.True(
            register.IsSuccessStatusCode,
            $"Registro falló ({(int)register.StatusCode}): {registerBody}");

        var login = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = Email,
            password = Password
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }

    private async Task<Guid> CreateReagentAsync(string name)
    {
        var response = await _client.PostAsJsonAsync("/api/reagents", new
        {
            name,
            chemicalFormula = "H2O",
            casNumber = "7732-18-5",
            quantity = 1000m,
            unit = "mL",
            location = "Vitrina test",
            hazardLevel = "Low",
            minQuantity = 1m
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<IdResponse>();
        Assert.NotNull(payload);
        return payload!.Id;
    }

    private async Task<Guid> CreateEquipmentAsync(string name)
    {
        var response = await _client.PostAsJsonAsync("/api/equipment", new
        {
            name,
            model = "Modelo test",
            serialNumber = $"SN-{Guid.NewGuid():N}",
            location = "Lab test",
            status = "Available"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<IdResponse>();
        Assert.NotNull(payload);
        return payload!.Id;
    }

    private async Task<Guid> CreateExperimentAsync(Guid reagentA, Guid reagentB, Guid equipmentX)
    {
        var response = await _client.PostAsJsonAsync("/api/experiments", new
        {
            name = "Experimento F10.2",
            description = "Experimento de prueba de edición",
            protocol = "Protocolo inicial",
            reagents = new[]
            {
                new { reagentId = reagentA, quantityUsed = 10.0m, unit = "mL", batchNumber = "LOTE-A1" },
                new { reagentId = reagentB, quantityUsed = 5.0m, unit = "mL", batchNumber = "LOTE-B1" }
            },
            equipment = new[]
            {
                new { equipmentId = equipmentX, usageHours = 1.0d }
            }
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<IdResponse>();
        Assert.NotNull(payload);
        return payload!.Id;
    }

    private async Task<JsonDocument> GetExperimentAsync(Guid experimentId)
    {
        var response = await _client.GetAsync($"/api/experiments/{experimentId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(body);
    }

    private sealed class IdResponse
    {
        public Guid Id { get; set; }
    }
}

