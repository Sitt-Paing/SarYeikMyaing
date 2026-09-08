using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;

namespace Bookshop.Entities;

[PrimaryKey("UserId", "LoginProvider", "Name")]
public partial class AspNetUserToken
{
    public string UserId { get; set; } = null!;

    [StringLength(450)]
    public string LoginProvider { get; set; } = null!;

    [StringLength(450)]
    public string Name { get; set; } = null!;

    public string? Value { get; set; }

    [JsonIgnore]
    [ForeignKey("UserId")]
    [InverseProperty("AspNetUserTokens")]
    public virtual AspNetUser User { get; set; } = null!;
}
