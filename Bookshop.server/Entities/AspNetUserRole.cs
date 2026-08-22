using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Bookshop.Entities;

[Keyless]
[Index("RoleId", Name = "IX_AspNetUserRoles_RoleId")]
public partial class AspNetUserRole
{
    public int UserId { get; set; }

    public string RoleId { get; set; } = null!;

    [JsonIgnore]
    [ForeignKey("RoleId")]
    public virtual AspNetRole Role { get; set; } = null!;

    [JsonIgnore]
    [ForeignKey("UserId")]
    public virtual AspNetUser User { get; set; } = null!;
}
