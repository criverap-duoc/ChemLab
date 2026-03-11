using System;
using System.Collections.Generic;

namespace ChemLab.Domain.Entities;

public class Request
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public RequestType Type { get; set; }
    public RequestStatus Status { get; set; }
    public RequestPriority Priority { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? ExpectedDate { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? Comments { get; set; }
    public string? RejectionReason { get; set; }

    // Relaciones
    public Guid RequestedById { get; set; }
    public virtual User RequestedBy { get; set; } = null!;

    public Guid? ApprovedById { get; set; }
    public virtual User? ApprovedBy { get; set; }

    public virtual ICollection<RequestItem> Items { get; set; } = new List<RequestItem>();
}

public enum RequestType
{
    Reagent = 0,
    Equipment = 1,
    Maintenance = 2,
    Calibration = 3,
    Other = 4
}

public enum RequestStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    InProgress = 3,
    Completed = 4,
    Cancelled = 5
}

public enum RequestPriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Urgent = 3
}

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
