// ChemLabBackend\src\ChemLab.API\Endpoints\SeedEndpoints.cs
using ChemLab.Domain.Entities;
using ChemLab.Domain.Enums;
using ChemLab.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ChemLab.API.Endpoints;

/// <summary>
/// F9.7b: seed de demostración para entornos recién desplegados (Render + Vercel).
/// Inserta 8 reactivos, 4 equipos, 2 experimentos, 2 solicitudes y un usuario RESEARCHER
/// de demo en UNA sola transacción. Guard explícito: si ya hay reactivos devuelve 400
/// para no duplicar datos si el endpoint se invoca dos veces.
/// Exige la policy "AdminOnly" (claim de rol de la cookie de Identity).
/// </summary>
public static class SeedEndpoints
{
    private const string DemoEmail = "demo@chemlab.com";
    private const string DemoPassword = "Demo123!";
    private const string ResearcherRole = "RESEARCHER";

    public static void MapSeedEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/setup").RequireAuthorization("AdminOnly");

        group.MapPost("/seed-demo", SeedDemoData)
            .WithName("SeedDemoData");
    }

    private static async Task<IResult> SeedDemoData(
        ApplicationDbContext context,
        UserManager<User> userManager,
        RoleManager<IdentityRole<Guid>> roleManager,
        HttpContext httpContext)
    {
        // El ADMIN autenticado es el creador de los registros (claim de la cookie).
        var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var adminId))
            return Results.Unauthorized();

        var admin = await userManager.FindByIdAsync(adminId.ToString());
        if (admin is null)
            return Results.Unauthorized();

        // Guard: el seed solo se ejecuta sobre una BD sin inventario.
        var existingReagents = await context.Reagents.CountAsync();
        if (existingReagents > 0)
        {
            return Results.BadRequest(new
            {
                Message = "Ya hay datos en el inventario: el seed de demo solo se ejecuta sobre una base de datos vacía.",
                Reagents = existingReagents
            });
        }

        // Defensivo: AddToRoleAsync lanza si el rol no existe. init-roles ya los crea,
        // pero el seed no debe depender de que se haya llamado antes.
        if (!await roleManager.RoleExistsAsync(ResearcherRole))
        {
            await roleManager.CreateAsync(new IdentityRole<Guid>
            {
                Name = ResearcherRole,
                NormalizedName = ResearcherRole.ToUpperInvariant()
            });
        }

        await using var transaction = await context.Database.BeginTransactionAsync();

        try
        {
            var now = DateTime.UtcNow;

            // ---------- Usuario RESEARCHER de demo ----------
            User? demoUser = await userManager.FindByEmailAsync(DemoEmail);
            var demoUserCreated = false;

            if (demoUser is null)
            {
                demoUser = new User
                {
                    Id = Guid.NewGuid(),
                    UserName = DemoEmail,
                    Email = DemoEmail,
                    FirstName = "Demo",
                    LastName = "Researcher",
                    CreatedAt = now,
                    IsActive = true
                };

                var createResult = await userManager.CreateAsync(demoUser, DemoPassword);
                if (!createResult.Succeeded)
                {
                    await transaction.RollbackAsync();
                    return Results.BadRequest(new
                    {
                        Message = "No se pudo crear el usuario de demo.",
                        Errors = createResult.Errors.Select(e => e.Description)
                    });
                }

                var roleResult = await userManager.AddToRoleAsync(demoUser, ResearcherRole);
                if (!roleResult.Succeeded)
                {
                    await transaction.RollbackAsync();
                    return Results.BadRequest(new
                    {
                        Message = $"No se pudo asignar el rol {ResearcherRole} al usuario de demo.",
                        Errors = roleResult.Errors.Select(e => e.Description)
                    });
                }

                demoUserCreated = true;
            }

            var demoUserId = demoUser!.Id;

            // ---------- 8 reactivos ----------
            var aguaDestilada = new Reagent
            {
                Id = Guid.NewGuid(),
                Name = "Agua destilada",
                ChemicalFormula = "H2O",
                CasNumber = "7732-18-5",
                Quantity = 5000m,
                Unit = "ml",
                Location = "Estante A1",
                HazardLevel = HazardLevel.None,
                Supplier = "Merck",
                ExpiryDate = null,
                MinQuantity = 500m,
                CreatedById = adminId,
                CreatedAt = now,
                IsActive = true
            };

            var etanol = new Reagent
            {
                Id = Guid.NewGuid(),
                Name = "Etanol 96%",
                ChemicalFormula = "C2H6O",
                CasNumber = "64-17-5",
                Quantity = 2000m,
                Unit = "ml",
                Location = "Estante A2",
                HazardLevel = HazardLevel.Low,
                Supplier = "Merck",
                ExpiryDate = now.AddYears(1),
                MinQuantity = 200m,
                CreatedById = adminId,
                CreatedAt = now,
                IsActive = true
            };

            var acidoSulfurico = new Reagent
            {
                Id = Guid.NewGuid(),
                Name = "Ácido Sulfúrico",
                ChemicalFormula = "H2SO4",
                CasNumber = "7664-93-9",
                Quantity = 500m,
                Unit = "ml",
                Location = "Gabinete Ácidos",
                HazardLevel = HazardLevel.Extreme,
                Supplier = "Sigma-Aldrich",
                ExpiryDate = now.AddMonths(18),
                MinQuantity = 100m,
                CreatedById = adminId,
                CreatedAt = now,
                IsActive = true
            };

            var hidroxidoSodio = new Reagent
            {
                Id = Guid.NewGuid(),
                Name = "Hidróxido de Sodio",
                ChemicalFormula = "NaOH",
                CasNumber = "1310-73-2",
                Quantity = 1000m,
                Unit = "g",
                Location = "Estante B1",
                HazardLevel = HazardLevel.High,
                Supplier = "Merck",
                ExpiryDate = now.AddYears(2),
                MinQuantity = 200m,
                CreatedById = adminId,
                CreatedAt = now,
                IsActive = true
            };

            var metanol = new Reagent
            {
                Id = Guid.NewGuid(),
                Name = "Metanol",
                ChemicalFormula = "CH4O",
                CasNumber = "67-56-1",
                Quantity = 1500m,
                Unit = "ml",
                Location = "Estante A3",
                HazardLevel = HazardLevel.High,
                Supplier = "J.T. Baker",
                ExpiryDate = now.AddMonths(14),
                MinQuantity = 150m,
                CreatedById = adminId,
                CreatedAt = now,
                IsActive = true
            };

            var acetona = new Reagent
            {
                Id = Guid.NewGuid(),
                Name = "Acetona",
                ChemicalFormula = "C3H6O",
                CasNumber = "67-64-1",
                Quantity = 2000m,
                Unit = "ml",
                Location = "Estante A4",
                HazardLevel = HazardLevel.Moderate,
                Supplier = "Merck",
                ExpiryDate = now.AddMonths(10),
                MinQuantity = 300m,
                CreatedById = adminId,
                CreatedAt = now,
                IsActive = true
            };

            var cloroformo = new Reagent
            {
                Id = Guid.NewGuid(),
                Name = "Cloroformo",
                ChemicalFormula = "CHCl3",
                CasNumber = "67-66-3",
                Quantity = 800m,
                Unit = "ml",
                Location = "Gabinete Solventes",
                HazardLevel = HazardLevel.High,
                Supplier = "Sigma-Aldrich",
                ExpiryDate = now.AddMonths(8),
                MinQuantity = 100m,
                CreatedById = adminId,
                CreatedAt = now,
                IsActive = true
            };

            var acidoClorhidrico = new Reagent
            {
                Id = Guid.NewGuid(),
                Name = "Ácido Clorhídrico",
                ChemicalFormula = "HCl",
                CasNumber = "7647-01-0",
                Quantity = 1000m,
                Unit = "ml",
                Location = "Gabinete Ácidos",
                HazardLevel = HazardLevel.High,
                Supplier = "Merck",
                ExpiryDate = now.AddMonths(20),
                MinQuantity = 200m,
                CreatedById = adminId,
                CreatedAt = now,
                IsActive = true
            };

            var reagents = new List<Reagent>
            {
                aguaDestilada,
                etanol,
                acidoSulfurico,
                hidroxidoSodio,
                metanol,
                acetona,
                cloroformo,
                acidoClorhidrico
            };

            // ---------- 4 equipos ----------
            var espectrofotometro = new Equipment
            {
                Id = Guid.NewGuid(),
                Name = "Espectrofotómetro UV-Vis",
                Model = "Shimadzu UV-1900",
                SerialNumber = "UV1900-2024-0412",
                Location = "Lab 1",
                Status = EquipmentStatus.Available,
                LastCalibration = now.AddDays(-335),
                NextCalibration = now.AddDays(30),
                CreatedById = adminId,
                CreatedAt = now,
                IsActive = true
            };

            var balanza = new Equipment
            {
                Id = Guid.NewGuid(),
                Name = "Balanza Analítica",
                Model = "Mettler Toledo XPR205",
                SerialNumber = "XPR205-884531",
                Location = "Lab 1",
                Status = EquipmentStatus.Available,
                LastCalibration = now.AddDays(-305),
                NextCalibration = now.AddDays(60),
                CreatedById = adminId,
                CreatedAt = now,
                IsActive = true
            };

            var hplc = new Equipment
            {
                Id = Guid.NewGuid(),
                Name = "Cromatógrafo HPLC",
                Model = "Agilent 1260",
                SerialNumber = "AG1260-77219",
                Location = "Lab 2",
                Status = EquipmentStatus.Available,
                LastCalibration = now.AddDays(-350),
                NextCalibration = now.AddDays(15),
                CreatedById = adminId,
                CreatedAt = now,
                IsActive = true
            };

            var centrifuga = new Equipment
            {
                Id = Guid.NewGuid(),
                Name = "Centrífuga",
                Model = "Eppendorf 5810R",
                SerialNumber = "EP5810R-33027",
                Location = "Lab 2",
                Status = EquipmentStatus.Available,
                LastCalibration = now.AddDays(-370),
                // Calibración vencida a propósito: la demo debe mostrar la alerta.
                NextCalibration = now.AddDays(-5),
                CreatedById = adminId,
                CreatedAt = now,
                IsActive = true
            };

            var equipment = new List<Equipment>
            {
                espectrofotometro,
                balanza,
                hplc,
                centrifuga
            };

            // ---------- 2 experimentos (creados por el ADMIN) ----------
            var sintesisAspirina = new Experiment
            {
                Id = Guid.NewGuid(),
                Name = "Síntesis de aspirina",
                Description = "Obtención de ácido acetilsalicílico por acetilación del ácido salicílico con anhídrido acético, catalizada por ácido sulfúrico.",
                Status = ExperimentStatus.Completed,
                StartDate = now.AddDays(-7),
                EndDate = now.AddDays(-2),
                Protocol = "1) Pesar 2.0 g de ácido salicílico. 2) Añadir 5 ml de anhídrido acético y 5 gotas de H2SO4. 3) Calentar a 70 °C durante 15 min. 4) Enfriar, filtrar y recristalizar en etanol.",
                Results = "Rendimiento 78 % (1.8 g). Punto de fusión 134-136 °C.",
                Notes = "Trabajar bajo campana: el anhídrido acético es lacrimógeno.",
                CreatedById = adminId,
                CreatedAt = now,
                IsActive = true
            };

            sintesisAspirina.Reagents.Add(new ExperimentReagent
            {
                Id = Guid.NewGuid(),
                ReagentId = acidoSulfurico.Id,
                QuantityUsed = 20m,
                Unit = "ml",
                BatchNumber = "LOT-H2SO4-2026"
            });

            sintesisAspirina.Reagents.Add(new ExperimentReagent
            {
                Id = Guid.NewGuid(),
                ReagentId = etanol.Id,
                QuantityUsed = 100m,
                Unit = "ml",
                BatchNumber = "LOT-ETOH-2026"
            });

            sintesisAspirina.Equipment.Add(new ExperimentEquipment
            {
                Id = Guid.NewGuid(),
                EquipmentId = balanza.Id,
                UsageHours = 1.5
            });

            var determinacionAcidez = new Experiment
            {
                Id = Guid.NewGuid(),
                Name = "Determinación de acidez",
                Description = "Valoración ácido-base de una muestra problema para determinar su acidez total expresada como ácido acético.",
                Status = ExperimentStatus.InProgress,
                StartDate = now.AddDays(-2),
                EndDate = null,
                Protocol = "1) Pesar 5 g de muestra. 2) Disolver en 50 ml de agua destilada. 3) Valorar con NaOH 0.1 N usando fenolftaleína como indicador.",
                Results = null,
                Notes = "Pendiente la segunda réplica para confirmar la reproducibilidad.",
                CreatedById = adminId,
                CreatedAt = now,
                IsActive = true
            };

            determinacionAcidez.Reagents.Add(new ExperimentReagent
            {
                Id = Guid.NewGuid(),
                ReagentId = hidroxidoSodio.Id,
                QuantityUsed = 50m,
                Unit = "g",
                BatchNumber = "LOT-NAOH-2026"
            });

            determinacionAcidez.Equipment.Add(new ExperimentEquipment
            {
                Id = Guid.NewGuid(),
                EquipmentId = espectrofotometro.Id,
                UsageHours = 0.8
            });

            var experiments = new List<Experiment>
            {
                sintesisAspirina,
                determinacionAcidez
            };

            // ---------- 2 solicitudes (del usuario demo) ----------
            var reposicionGuantes = new Request
            {
                Id = Guid.NewGuid(),
                Title = "Reposición de guantes nitrilo",
                Description = "Se requiere reponer guantes de nitrilo talla M para el Lab 1: el stock actual está por debajo del mínimo operativo.",
                Type = RequestType.Equipment,
                Status = RequestStatus.Pending,
                Priority = RequestPriority.Medium,
                RequestedAt = now.AddDays(-1),
                ExpectedDate = now.AddDays(7),
                RequestedById = demoUserId
            };

            reposicionGuantes.Items.Add(new RequestItem
            {
                Id = Guid.NewGuid(),
                ItemName = "Guantes de nitrilo talla M",
                CatalogNumber = "VWR-112-4714",
                Quantity = 10m,
                Unit = "caja",
                Specifications = "100 unidades por caja, libres de polvo, EN 374",
                Supplier = "VWR",
                EstimatedPrice = 12.50m
            });

            var compraAcetona = new Request
            {
                Id = Guid.NewGuid(),
                Title = "Compra de acetona",
                Description = "Reposición de acetona grado analítico para el laboratorio de síntesis (stock por debajo del mínimo).",
                Type = RequestType.Reagent,
                Status = RequestStatus.Approved,
                Priority = RequestPriority.High,
                RequestedAt = now.AddDays(-3),
                ExpectedDate = now.AddDays(5),
                ResolvedAt = now.AddDays(-2),
                Comments = "Aprobada por el administrador. Compra autorizada al proveedor habitual.",
                ApprovedById = adminId,
                RequestedById = demoUserId
            };

            compraAcetona.Items.Add(new RequestItem
            {
                Id = Guid.NewGuid(),
                ItemName = "Acetona grado analítico",
                CatalogNumber = "MERCK-100014",
                CasNumber = "67-64-1",
                Quantity = 4m,
                Unit = "L",
                Specifications = "Pureza ≥ 99.5 %, bidón de 2.5 L",
                Supplier = "Merck",
                EstimatedPrice = 48.90m
            });

            var requests = new List<Request>
            {
                reposicionGuantes,
                compraAcetona
            };

            // ---------- Persistencia atómica ----------
            context.Reagents.AddRange(reagents);
            context.Equipment.AddRange(equipment);
            context.Experiments.AddRange(experiments);
            context.Requests.AddRange(requests);

            await context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Results.Ok(new
            {
                Message = "Datos de demostración insertados correctamente.",
                Inserted = new
                {
                    Reagents = reagents.Count,
                    Equipment = equipment.Count,
                    Experiments = experiments.Count,
                    Requests = requests.Count,
                    Users = demoUserCreated ? 1 : 0
                },
                DemoUser = new
                {
                    Email = DemoEmail,
                    Password = DemoPassword,
                    Role = ResearcherRole,
                    Created = demoUserCreated
                },
                Details = new
                {
                    Reagents = reagents.Select(r => r.Name),
                    Equipment = equipment.Select(e => e.Name),
                    Experiments = experiments.Select(e => e.Name),
                    Requests = requests.Select(r => r.Title)
                }
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return Results.Problem(
                title: "Error al insertar los datos de demostración",
                detail: ex.Message,
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }
}
