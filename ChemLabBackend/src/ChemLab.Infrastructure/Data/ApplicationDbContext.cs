// src\ChemLab.Infrastructure\Data\ApplicationDbContext.cs

using ChemLab.Domain.Entities;
using ChemLab.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

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

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

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

                entity.HasOne(e => e.CreatedBy)
                    .WithMany()
                    .HasForeignKey(e => e.CreatedById)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            builder.Entity<ExperimentReagent>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.QuantityUsed).HasPrecision(18, 4);

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

                entity.HasOne(e => e.Experiment)
                    .WithMany(e => e.Equipment)
                    .HasForeignKey(e => e.ExperimentId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Equipment)
                    .WithMany()
                    .HasForeignKey(e => e.EquipmentId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

    }
}
