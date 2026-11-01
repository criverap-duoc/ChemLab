using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChemLab.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExperiments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Experiments",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    Name = table.Column<string>(maxLength: 200, nullable: false),
                    Description = table.Column<string>(maxLength: 1000, nullable: false),
                    Status = table.Column<int>(nullable: false),
                    StartDate = table.Column<DateTime>(nullable: false),
                    EndDate = table.Column<DateTime>(nullable: true),
                    Protocol = table.Column<string>(maxLength: 4000, nullable: true),
                    Results = table.Column<string>(maxLength: 4000, nullable: true),
                    Notes = table.Column<string>(nullable: true),
                    CreatedById = table.Column<Guid>(nullable: false),
                    CreatedAt = table.Column<DateTime>(nullable: false),
                    UpdatedAt = table.Column<DateTime>(nullable: true),
                    IsActive = table.Column<bool>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Experiments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Experiments_AspNetUsers_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ExperimentEquipment",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    ExperimentId = table.Column<Guid>(nullable: false),
                    EquipmentId = table.Column<Guid>(nullable: false),
                    UsageHours = table.Column<double>(nullable: true),
                    CalibrationBefore = table.Column<string>(nullable: true),
                    CalibrationAfter = table.Column<string>(nullable: true)
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

            migrationBuilder.CreateTable(
                name: "ExperimentReagents",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    ExperimentId = table.Column<Guid>(nullable: false),
                    ReagentId = table.Column<Guid>(nullable: false),
                    QuantityUsed = table.Column<decimal>(precision: 18, scale: 4, nullable: false),
                    Unit = table.Column<string>(nullable: false),
                    BatchNumber = table.Column<string>(nullable: true)
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

            migrationBuilder.CreateIndex(
                name: "IX_ExperimentEquipment_EquipmentId",
                table: "ExperimentEquipment",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ExperimentEquipment_ExperimentId",
                table: "ExperimentEquipment",
                column: "ExperimentId");

            migrationBuilder.CreateIndex(
                name: "IX_ExperimentReagents_ExperimentId",
                table: "ExperimentReagents",
                column: "ExperimentId");

            migrationBuilder.CreateIndex(
                name: "IX_ExperimentReagents_ReagentId",
                table: "ExperimentReagents",
                column: "ReagentId");

            migrationBuilder.CreateIndex(
                name: "IX_Experiments_CreatedById",
                table: "Experiments",
                column: "CreatedById");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExperimentEquipment");

            migrationBuilder.DropTable(
                name: "ExperimentReagents");

            migrationBuilder.DropTable(
                name: "Experiments");
        }
    }
}
