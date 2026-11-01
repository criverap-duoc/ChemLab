using System;

namespace ChemLab.Domain.Entities;

public class RequestItem
{
    public Guid Id { get; set; }
    public Guid RequestId { get; set; }
    public virtual Request Request { get; set; } = null!;

    public string ItemName { get; set; } = string.Empty;
    public string? CatalogNumber { get; set; }
    public string? CasNumber { get; set; }
    public decimal? Quantity { get; set; }
    public string? Unit { get; set; }
    public string? Specifications { get; set; }
    public string? Supplier { get; set; }
    public decimal? EstimatedPrice { get; set; }
}
