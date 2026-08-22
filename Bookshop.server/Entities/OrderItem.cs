using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Bookshop.Entities;

[Table("OrderItem")]
public partial class OrderItem
{
    [Key]
    public int Id { get; set; }

    [StringLength(50)]
    public string OrderId { get; set; } = null!;

    public int BookId { get; set; }

    [StringLength(500)]
    public string BookTitle { get; set; } = null!;

    public int Quantity { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal TotalPrice { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? CreatedOn { get; set; }

    [StringLength(100)]
    public string? CreatedBy { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? UpdatedOn { get; set; }

    [StringLength(100)]
    public string? UpdatedBy { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? DeletedOn { get; set; }

    [StringLength(100)]
    public string? DeletedBy { get; set; }

    [JsonIgnore]
    [ForeignKey("BookId")]
    [InverseProperty("OrderItems")]
    public virtual Book Book { get; set; } = null!;

    [JsonIgnore]
    [ForeignKey("OrderId")]
    [InverseProperty("OrderItems")]
    public virtual Order Order { get; set; } = null!;
}
