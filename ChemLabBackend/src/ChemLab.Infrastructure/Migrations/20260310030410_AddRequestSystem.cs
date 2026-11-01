using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChemLab.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRequestSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    Title = table.Column<string>(maxLength: 200, nullable: false),
                    Description = table.Column<string>(maxLength: 1000, nullable: false),
                    Type = table.Column<int>(nullable: false),
                    Status = table.Column<int>(nullable: false),
                    Priority = table.Column<int>(nullable: false),
                    RequestedAt = table.Column<DateTime>(nullable: false),
                    ExpectedDate = table.Column<DateTime>(nullable: true),
                    ResolvedAt = table.Column<DateTime>(nullable: true),
                    Comments = table.Column<string>(maxLength: 500, nullable: true),
                    RejectionReason = table.Column<string>(maxLength: 500, nullable: true),
                    RequestedById = table.Column<Guid>(nullable: false),
                    ApprovedById = table.Column<Guid>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Requests_AspNetUsers_ApprovedById",
                        column: x => x.ApprovedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Requests_AspNetUsers_RequestedById",
                        column: x => x.RequestedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RequestItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    RequestId = table.Column<Guid>(nullable: false),
                    ItemName = table.Column<string>(maxLength: 200, nullable: false),
                    CatalogNumber = table.Column<string>(maxLength: 100, nullable: true),
                    CasNumber = table.Column<string>(maxLength: 50, nullable: true),
                    Quantity = table.Column<decimal>(nullable: true),
                    Unit = table.Column<string>(maxLength: 20, nullable: true),
                    Specifications = table.Column<string>(maxLength: 500, nullable: true),
                    Supplier = table.Column<string>(maxLength: 200, nullable: true),
                    EstimatedPrice = table.Column<decimal>(precision: 18, scale: 2, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RequestItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RequestItems_Requests_RequestId",
                        column: x => x.RequestId,
                        principalTable: "Requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RequestItems_RequestId",
                table: "RequestItems",
                column: "RequestId");

            migrationBuilder.CreateIndex(
                name: "IX_Requests_ApprovedById",
                table: "Requests",
                column: "ApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_Requests_RequestedById",
                table: "Requests",
                column: "RequestedById");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RequestItems");

            migrationBuilder.DropTable(
                name: "Requests");
        }
    }
}
