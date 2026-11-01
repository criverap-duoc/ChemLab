using System;
using System.Collections.Generic;
using ChemLab.Domain.Enums;

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

