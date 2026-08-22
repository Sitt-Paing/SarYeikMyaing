using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Bookshop.Entities;

[Table("Order")]
public partial class Order
{
    [Key]
    [StringLength(50)]
    public string Id { get; set; } = null!;

    [StringLength(50)]
    public string OrderNumber { get; set; } = null!;

    public int? UserId { get; set; }

    [StringLength(100)]
    public string CusName { get; set; } = null!;

    [StringLength(200)]
    public string? CusEmail { get; set; }

    [StringLength(50)]
    public string CusPhone { get; set; } = null!;

    [StringLength(150)]
    public string ShippingAddress { get; set; } = null!;

    [StringLength(100)]
    public string ShippingCity { get; set; } = null!;

    [StringLength(100)]
    public string ShippingTownship { get; set; } = null!;

    [Column(TypeName = "decimal(18, 2)")]
    public decimal SubTotal { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal ShippingFee { get; set; }

    public int? Discount { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal TotalAmount { get; set; }

    [StringLength(50)]
    [Unicode(false)]
    public string Status { get; set; } = null!;

    [Column(TypeName = "datetime")]
    public DateTime? CreatedOn { get; set; }

    [StringLength(50)]
    public string? CreatedBy { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? UpdatedOn { get; set; }

    [StringLength(50)]
    public string? UpdatedBy { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime? DeletedOn { get; set; }

    [StringLength(50)]
    public string? DeletedBy { get; set; }

    [JsonIgnore]
    [InverseProperty("Order")]
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    [JsonIgnore]
    [InverseProperty("Order")]
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    [JsonIgnore]
    [ForeignKey("UserId")]
    [InverseProperty("Orders")]
    public virtual AspNetUser? User { get; set; }
}
