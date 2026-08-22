using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Bookshop.Entities;

[PrimaryKey("LoginProvider", "ProviderKey")]
[Index("UserId", Name = "IX_AspNetUserLogins_UserId")]
public partial class AspNetUserLogin
{
    [Key]
    public string LoginProvider { get; set; } = null!;

    [Key]
    public string ProviderKey { get; set; } = null!;

    public string? ProviderDisplayName { get; set; }

    public int UserId { get; set; }

    [JsonIgnore]
    [ForeignKey("UserId")]
    [InverseProperty("AspNetUserLogins")]
    public virtual AspNetUser User { get; set; } = null!;
}
