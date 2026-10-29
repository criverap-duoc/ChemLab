// src\ChemLab.Infrastructure\Data\ApplicationDbContext.cs

using ChemLab.Domain.Entities;
using ChemLab.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace ChemLab.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Reagent> Reagents { get; set; }
    public DbSet<Equipment> Equipment { get; set; }
    public DbSet<Experiment> Experiments { get; set; }
    public DbSet<ExperimentReagent> ExperimentReagents { get; set; }
    public DbSet<ExperimentEquipment> ExperimentEquipment { get; set; }
    public DbSet<Request> Requests { get; set; }
    public DbSet<RequestItem> RequestItems { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // F6.5j: forzar Guid → string minúsculas (alineado con Identity)
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(Guid) || property.ClrType == typeof(Guid?))
                {
                    property.SetValueConverter(new GuidToStringConverter());
                }
            }
        }

        // Configuración de User
        builder.Entity<User>(entity =>
        {
            entity.Property(e => e.FirstName)
                .IsRequired()
                .HasMaxLength(100);
            entity.Property(e => e.LastName)
                .IsRequired()
                .HasMaxLength(100);
        });

        // Configuración de Reagent
        builder.Entity<Reagent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ChemicalFormula).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CasNumber).HasMaxLength(50);
            entity.Property(e => e.Quantity).HasPrecision(18, 4);
            entity.Property(e => e.Unit).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Location).HasMaxLength(100);
            entity.Property(e => e.Supplier).HasMaxLength(200);
            entity.Property(e => e.MinQuantity).HasPrecision(18, 4);

            // Configurar enum HazardLevel como int
            entity.Property(e => e.HazardLevel)
                .HasConversion<int>();

            // Relación con User
            entity.HasOne(e => e.CreatedBy)
                .WithMany(u => u.CreatedReagents)
                .HasForeignKey(e => e.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuración de Equipment
        builder.Entity<Equipment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Model).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SerialNumber).HasMaxLength(100);
            entity.Property(e => e.Location).HasMaxLength(100);

            // Configurar enum EquipmentStatus como int
            entity.Property(e => e.Status)
                .HasConversion<int>();

            // Relación con User
            entity.HasOne(e => e.CreatedBy)
                .WithMany(u => u.CreatedEquipment)
                .HasForeignKey(e => e.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Experiment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Protocol).HasMaxLength(4000);
                entity.Property(e => e.Results).HasMaxLength(4000);
                entity.Property(e => e.Status).HasConversion<int>();
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => new { e.CreatedById, e.IsActive });

                entity.HasOne(e => e.CreatedBy)
                    .WithMany()
                    .HasForeignKey(e => e.CreatedById)
                    .OnDelete(DeleteBehavior.Restrict);
            });

        builder.Entity<ExperimentReagent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.QuantityUsed).HasPrecision(18, 4);
            entity.Property(e => e.Unit).IsRequired().HasMaxLength(20);
            entity.Property(e => e.BatchNumber).HasMaxLength(100);
            entity.HasIndex(e => new { e.ExperimentId, e.ReagentId });

            entity.HasOne(e => e.Experiment)
                .WithMany(e => e.Reagents)
                .HasForeignKey(e => e.ExperimentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Reagent)
                .WithMany()
                .HasForeignKey(e => e.ReagentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<ExperimentEquipment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CalibrationBefore).HasMaxLength(200);
            entity.Property(e => e.CalibrationAfter).HasMaxLength(200);
            entity.HasIndex(e => new { e.ExperimentId, e.EquipmentId });

            entity.HasOne(e => e.Experiment)
                .WithMany(e => e.Equipment)
                .HasForeignKey(e => e.ExperimentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Equipment)
                .WithMany()
                .HasForeignKey(e => e.EquipmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Request>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Comments).HasMaxLength(500);
            entity.Property(e => e.RejectionReason).HasMaxLength(500);
            entity.Property(e => e.Type).HasConversion<int>();
            entity.Property(e => e.Status).HasConversion<int>();
            entity.Property(e => e.Priority).HasConversion<int>();
            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.RequestedAt);
            entity.HasIndex(e => new { e.RequestedById, e.Status });

            entity.HasOne(e => e.RequestedBy)
                .WithMany()
                .HasForeignKey(e => e.RequestedById)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ApprovedBy)
                .WithMany()
                .HasForeignKey(e => e.ApprovedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<RequestItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ItemName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CatalogNumber).HasMaxLength(100);
            entity.Property(e => e.CasNumber).HasMaxLength(50);
            entity.Property(e => e.Unit).HasMaxLength(20);
            entity.Property(e => e.Specifications).HasMaxLength(500);
            entity.Property(e => e.Supplier).HasMaxLength(200);
            entity.Property(e => e.Quantity).HasPrecision(18, 4);
            entity.Property(e => e.EstimatedPrice).HasPrecision(18, 2);

            entity.HasOne(e => e.Request)
                .WithMany(r => r.Items)
                .HasForeignKey(e => e.RequestId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Message).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.IsRead);
            entity.HasIndex(e => e.Timestamp);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });


    }
}
