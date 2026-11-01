using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChemLab.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExperimentReagentsAndEquipmentTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // IMPORTANTE: la migración AddExperiments ya crea ExperimentReagents y
            // ExperimentEquipment. Para que esta migración funcione tanto en una BD
            // recreada desde cero como en una BD antigua donde faltaban esas tablas,
            // se usa SQL idempotente (IF NOT EXISTS) en lugar de CreateTable.
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ""ExperimentReagents"" (
                    ""Id"" TEXT NOT NULL CONSTRAINT ""PK_ExperimentReagents"" PRIMARY KEY,
                    ""ExperimentId"" TEXT NOT NULL,
                    ""ReagentId"" TEXT NOT NULL,
                    ""QuantityUsed"" TEXT NOT NULL,
                    ""Unit"" TEXT NOT NULL,
                    ""BatchNumber"" TEXT NULL,
                    CONSTRAINT ""FK_ExperimentReagents_Experiments_ExperimentId"" FOREIGN KEY (""ExperimentId"") REFERENCES ""Experiments"" (""Id"") ON DELETE CASCADE,
                    CONSTRAINT ""FK_ExperimentReagents_Reagents_ReagentId"" FOREIGN KEY (""ReagentId"") REFERENCES ""Reagents"" (""Id"") ON DELETE RESTRICT
                );");

            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ""ExperimentEquipment"" (
                    ""Id"" TEXT NOT NULL CONSTRAINT ""PK_ExperimentEquipment"" PRIMARY KEY,
                    ""ExperimentId"" TEXT NOT NULL,
                    ""EquipmentId"" TEXT NOT NULL,
                    ""UsageHours"" REAL NULL,
                    ""CalibrationBefore"" TEXT NULL,
                    ""CalibrationAfter"" TEXT NULL,
                    CONSTRAINT ""FK_ExperimentEquipment_Equipment_EquipmentId"" FOREIGN KEY (""EquipmentId"") REFERENCES ""Equipment"" (""Id"") ON DELETE RESTRICT,
                    CONSTRAINT ""FK_ExperimentEquipment_Experiments_ExperimentId"" FOREIGN KEY (""ExperimentId"") REFERENCES ""Experiments"" (""Id"") ON DELETE CASCADE
                );");

            // Crear índices (idempotente)
            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_ExperimentReagents_ExperimentId"" ON ""ExperimentReagents"" (""ExperimentId"");");

            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_ExperimentReagents_ReagentId"" ON ""ExperimentReagents"" (""ReagentId"");");

            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_ExperimentEquipment_EquipmentId"" ON ""ExperimentEquipment"" (""EquipmentId"");");

            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_ExperimentEquipment_ExperimentId"" ON ""ExperimentEquipment"" (""ExperimentId"");");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExperimentReagents");

            migrationBuilder.DropTable(
                name: "ExperimentEquipment");
        }
    }
}
