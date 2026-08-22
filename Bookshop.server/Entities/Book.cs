using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Bookshop.Entities;

[Table("Book")]
public partial class Book
{
    [Key]
    public int Id { get; set; }

    [StringLength(300)]
    public string Title { get; set; } = null!;

    public int AuthorId { get; set; }

    [StringLength(200)]
    public string? Slug { get; set; }

    [Column("ISBN")]
    [StringLength(50)]
    public string Isbn { get; set; } = null!;

    public string? Description { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal OriginalPrice { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal Price { get; set; }

    public int StockQuantity { get; set; }

    public string? ImageUrl { get; set; }

    public int CategoryId { get; set; }

    public DateOnly? PublishedDate { get; set; }

    public int? PageCount { get; set; }

    [StringLength(100)]
    public string? Publisher { get; set; }

    [StringLength(50)]
    [Unicode(false)]
    public string? Language { get; set; }

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
    [ForeignKey("AuthorId")]
    [InverseProperty("Books")]
    public virtual Author Author { get; set; } = null!;

    [JsonIgnore]
    [InverseProperty("Book")]
    public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

    [JsonIgnore]
    [InverseProperty("Book")]
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
