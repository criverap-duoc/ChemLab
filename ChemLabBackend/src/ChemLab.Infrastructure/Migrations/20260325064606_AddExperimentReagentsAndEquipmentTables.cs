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
            // Solo crear las tablas que faltan (ExperimentReagents y ExperimentEquipment)
            migrationBuilder.CreateTable(
                name: "ExperimentReagents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ExperimentId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ReagentId = table.Column<Guid>(type: "TEXT", nullable: false),
                    QuantityUsed = table.Column<decimal>(type: "TEXT", precision: 18, scale: 4, nullable: false),
                    Unit = table.Column<string>(type: "TEXT", nullable: false),
                    BatchNumber = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExperimentReagents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExperimentReagents_Experiments_ExperimentId",
                        column: x => x.ExperimentId,
                        principalTable: "Experiments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExperimentReagents_Reagents_ReagentId",
                        column: x => x.ReagentId,
                        principalTable: "Reagents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ExperimentEquipment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ExperimentId = table.Column<Guid>(type: "TEXT", nullable: false),
                    EquipmentId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UsageHours = table.Column<double>(type: "REAL", nullable: true),
                    CalibrationBefore = table.Column<string>(type: "TEXT", nullable: true),
                    CalibrationAfter = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExperimentEquipment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExperimentEquipment_Equipment_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "Equipment",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ExperimentEquipment_Experiments_ExperimentId",
                        column: x => x.ExperimentId,
                        principalTable: "Experiments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Crear índices
            migrationBuilder.CreateIndex(
                name: "IX_ExperimentReagents_ExperimentId",
                table: "ExperimentReagents",
                column: "ExperimentId");

            migrationBuilder.CreateIndex(
                name: "IX_ExperimentReagents_ReagentId",
                table: "ExperimentReagents",
                column: "ReagentId");

            migrationBuilder.CreateIndex(
                name: "IX_ExperimentEquipment_EquipmentId",
                table: "ExperimentEquipment",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ExperimentEquipment_ExperimentId",
                table: "ExperimentEquipment",
                column: "ExperimentId");
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
