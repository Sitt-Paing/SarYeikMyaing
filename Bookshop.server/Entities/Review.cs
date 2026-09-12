using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Bookshop.Entities;

[Table("Review")]
public partial class Review
{
    [Key]
    public int Id { get; set; }

    public int BookId { get; set; }

    [StringLength(450)]
    public string? UserId { get; set; }

    [StringLength(150)]
    public string UserName { get; set; } = "Anonymous";

    [Range(1, 5)]
    public int Rating { get; set; }

    [StringLength(1000)]
    public string? Comment { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    [ForeignKey("BookId")]
    [InverseProperty("Reviews")]
    public virtual Book? Book { get; set; }
}
