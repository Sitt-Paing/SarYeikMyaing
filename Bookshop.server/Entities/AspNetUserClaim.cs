using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Bookshop.Entities;

[Index("UserId", Name = "IX_AspNetUserClaims_UserId")]
public partial class AspNetUserClaim
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    public string? ClaimType { get; set; }

    public string? ClaimValue { get; set; }

    [JsonIgnore]
    [ForeignKey("UserId")]
    [InverseProperty("AspNetUserClaims")]
    public virtual AspNetUser User { get; set; } = null!;
}
