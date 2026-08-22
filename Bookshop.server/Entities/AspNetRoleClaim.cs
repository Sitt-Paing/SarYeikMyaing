using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Bookshop.Entities;

[Index("RoleId", Name = "IX_AspNetRoleClaims_RoleId")]
public partial class AspNetRoleClaim
{
    [Key]
    public int Id { get; set; }

    public string RoleId { get; set; } = null!;

    public string? ClaimType { get; set; }

    public string? ClaimValue { get; set; }

    [JsonIgnore]
    [ForeignKey("RoleId")]
    [InverseProperty("AspNetRoleClaims")]
    public virtual AspNetRole Role { get; set; } = null!;
}
