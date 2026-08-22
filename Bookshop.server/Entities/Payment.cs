using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Bookshop.Entities;

[Table("Payment")]
public partial class Payment
{
    [Key]
    [StringLength(50)]
    public string Id { get; set; } = null!;

    [StringLength(50)]
    public string OrderId { get; set; } = null!;

    [StringLength(50)]
    public string PaymentMethod { get; set; } = null!;

    [StringLength(100)]
    public string TransactionId { get; set; } = null!;

    [Column(TypeName = "decimal(18, 2)")]
    public decimal Amount { get; set; }

    [StringLength(50)]
    public string Status { get; set; } = null!;

    [Column(TypeName = "datetime")]
    public DateTime PaidOn { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime CreatedOn { get; set; }

    [JsonIgnore]
    [ForeignKey("OrderId")]
    [InverseProperty("Payments")]
    public virtual Order Order { get; set; } = null!;
}
