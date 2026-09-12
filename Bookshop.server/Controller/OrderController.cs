using System.Security.Claims;
using Bookshop.Data;
using Bookshop.Entities;
using Bookshop.Interfaces.Repositories;
using Bookshop.Models;
using System.Linq.Dynamic.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bookshop.Controller;

[Route("api/[controller]")]
[ApiController]
public class OrderController(IRepositoryWrapper repo, BookshopDbContext context) : ControllerBase
{
    private readonly IRepositoryWrapper _repo = repo ?? throw new Exception("Repo is null");
    private readonly BookshopDbContext _context = context ?? throw new Exception("Context is null");

    [HttpGet]
    [EndpointSummary("Get Order List with OrderItems, Server-Side Pagination, Date Range, and Filters")]
    public async Task<IActionResult> GetAsync(
        int skipRows = 0,
        int pageSize = 50,
        string? q = null,
        string? status = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? sortField = null,
        int order = -1)
    {
        if (pageSize <= 0) pageSize = 50;
        if (skipRows < 0) skipRows = 0;

        IQueryable<Order> query = _context.Orders
            .AsNoTracking()
            .Where(x => !x.DeletedOn.HasValue);

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(x => x.Status == status);
        }

        if (fromDate.HasValue)
        {
            var start = fromDate.Value.Date;
            query = query.Where(x => x.CreatedOn >= start);
        }

        if (toDate.HasValue)
        {
            var end = toDate.Value.Date.AddDays(1);
            query = query.Where(x => x.CreatedOn < end);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            string search = q.Trim().ToLower();
            query = query.Where(x => (x.OrderNumber != null && x.OrderNumber.ToLower().Contains(search))
                                  || (x.Id != null && x.Id.ToLower().Contains(search))
                                  || (x.CusName != null && x.CusName.ToLower().Contains(search))
                                  || (x.CusPhone != null && x.CusPhone.ToLower().Contains(search))
                                  || (x.ShippingCity != null && x.ShippingCity.ToLower().Contains(search))
                                  || (x.PaymentMethod != null && x.PaymentMethod.ToLower().Contains(search)));
        }

        int recordsTotal = await query.CountAsync();

        if (!string.IsNullOrWhiteSpace(sortField))
        {
            query = query.OrderBy($"{sortField} {(order > 0 ? "ascending" : "descending")}");
        }
        else
        {
            query = query.OrderByDescending(x => x.CreatedOn);
        }

        var records = await query
            .Include(x => x.OrderItems)
            .Skip(skipRows)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = StatusCodes.Status200OK,
            Message = "Success pagination",
            Data = new { records, recordsTotal }
        });
    }

    [HttpGet("{id}")]
    [EndpointSummary("Get Order by Id")]
    public async Task<IActionResult> GetAsync(string id)
    {
        var data = await _context.Orders
            .AsNoTracking()
            .Include(x => x.OrderItems)
            .FirstOrDefaultAsync(x => x.Id == id && !x.DeletedOn.HasValue);

        if (data == null)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Order not found",
                Data = null
            });
        }

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Success",
            Data = new
            {
                Order = data,
                OrderItems = data.OrderItems
            }
        });
    }

    [HttpGet("user/{userId}")]
    [EndpointSummary("Get Orders by User Id with OrderItems, Pagination, and Filters")]
    public async Task<IActionResult> GetByUserIdAsync(
        string userId,
        int skipRows = 0,
        int pageSize = 50,
        string? status = null,
        DateTime? fromDate = null,
        DateTime? toDate = null)
    {
        if (pageSize <= 0) pageSize = 50;
        if (skipRows < 0) skipRows = 0;

        IQueryable<Order> query = _context.Orders
            .AsNoTracking()
            .Where(x => x.UserId == userId && !x.DeletedOn.HasValue);

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(x => x.Status == status);
        }

        if (fromDate.HasValue)
        {
            var start = fromDate.Value.Date;
            query = query.Where(x => x.CreatedOn >= start);
        }

        if (toDate.HasValue)
        {
            var end = toDate.Value.Date.AddDays(1);
            query = query.Where(x => x.CreatedOn < end);
        }

        int recordsTotal = await query.CountAsync();

        var records = await query
            .OrderByDescending(x => x.CreatedOn)
            .Include(x => x.OrderItems)
            .Skip(skipRows)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = StatusCodes.Status200OK,
            Message = "Success",
            Data = new { records, recordsTotal }
        });
    }

    [AllowAnonymous]
    [HttpPost("upload-slip")]
    [EndpointSummary("Upload Payment Slip Screenshot")]
    public async Task<IActionResult> UploadSlipAsync([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "No file was uploaded.",
                Data = null
            });
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(ext))
        {
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Invalid image file type. Allowed: .jpg, .jpeg, .png, .webp",
                Data = null
            });
        }

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "slips");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = $"slip_{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var request = HttpContext.Request;
        var slipUrl = $"{request.PathBase}/uploads/slips/{uniqueFileName}";

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Payment slip uploaded successfully",
            Data = new { url = slipUrl, fileName = uniqueFileName }
        });
    }

    [HttpPost]
    [EndpointSummary("Create Order (Supports Authenticated & Guest Mode) with Concurrency/Race Condition Guard")]
    public async Task<IActionResult> CreateAsync([FromBody] Order model)
    {
        if (model == null)
        {
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Order payload cannot be null.",
                Data = null
            });
        }

        if (model.OrderItems == null || model.OrderItems.Count == 0)
        {
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Order must contain at least one item.",
                Data = null
            });
        }

        foreach (var item in model.OrderItems)
        {
            if (item.Quantity <= 0)
            {
                var bookName = !string.IsNullOrWhiteSpace(item.BookTitle) ? item.BookTitle : $"#{item.BookId}";
                return BadRequest(new DefaultResponseModel
                {
                    Success = false,
                    Statuscode = 400,
                    Message = $"Invalid quantity for book '{bookName}'. Quantity must be greater than 0.",
                    Data = null
                });
            }
        }

        // Database transaction ensures atomicity: either all stock deductions and order creation succeed, or everything rolls back cleanly.
        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            string orderId = string.IsNullOrWhiteSpace(model.Id) ? Guid.NewGuid().ToString() : model.Id;
            string orderNumber = string.IsNullOrWhiteSpace(model.OrderNumber)
                ? $"ORD-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}"
                : model.OrderNumber;

            // Consolidate duplicate items by BookId to accurately decrement stock
            var consolidatedItems = model.OrderItems
                .GroupBy(x => x.BookId)
                .Select(g => new
                {
                    BookId = g.Key,
                    TotalQuantity = g.Sum(x => x.Quantity),
                    BookTitle = g.First().BookTitle
                })
                .ToList();

            // 1. ATOMIC CONDITIONAL UPDATE:
            // Direct SQL execution at the database level with a row lock:
            // "UPDATE Books SET StockQuantity = StockQuantity - @qty WHERE Id = @id AND StockQuantity >= @qty"
            // This prevents race conditions: if multiple customers attempt to order the same book simultaneously,
            // SQL Server serializes the row update. Only the request with sufficient stock affects 1 row.
            // Any request that exceeds remaining stock affects 0 rows and fails immediately without overselling.
            foreach (var item in consolidatedItems)
            {
                int affectedRows = await _context.Books
                    .Where(b => b.Id == item.BookId && b.StockQuantity >= item.TotalQuantity)
                    .ExecuteUpdateAsync(s => s.SetProperty(b => b.StockQuantity, b => b.StockQuantity - item.TotalQuantity));

                if (affectedRows == 0)
                {
                    await transaction.RollbackAsync();

                    var currentBook = await _context.Books.AsNoTracking().FirstOrDefaultAsync(b => b.Id == item.BookId);
                    var title = currentBook?.Title ?? item.BookTitle ?? "One of the selected books";
                    var available = currentBook?.StockQuantity ?? 0;

                    return BadRequest(new DefaultResponseModel
                    {
                        Success = false,
                        Statuscode = 400,
                        Message = $"Insufficient stock for '{title}' (Available: {available}, Requested: {item.TotalQuantity}). Please adjust your cart quantity.",
                        Data = null
                    });
                }
            }

            // 2. Determine initial status: Cash on Delivery is Confirmed; Slip transfers are Pending verification
            bool isCod = string.Equals(model.PaymentMethod, "CashOnDelivery", StringComparison.OrdinalIgnoreCase);
            string initialStatus = isCod ? "Confirmed" : "Pending";

            Order order = new Order
            {
                Id = orderId,
                OrderNumber = orderNumber,
                UserId = currentUserId ?? model.UserId,
                CusName = model.CusName,
                CusEmail = model.CusEmail,
                CusPhone = model.CusPhone,
                ShippingAddress = model.ShippingAddress,
                ShippingCity = model.ShippingCity,
                ShippingTownship = model.ShippingTownship,
                SubTotal = model.SubTotal,
                ShippingFee = model.ShippingFee,
                Discount = model.Discount,
                TotalAmount = model.TotalAmount,
                PaymentMethod = model.PaymentMethod,
                PaymentSlipUrl = model.PaymentSlipUrl,
                PaymentNotes = model.PaymentNotes,
                Status = initialStatus,
                CreatedOn = DateTime.Now,
                CreatedBy = currentUserId ?? "Guest"
            };

            _context.Orders.Add(order);

            // 3. Add order items
            foreach (var item in model.OrderItems)
            {
                OrderItem orderItem = new OrderItem
                {
                    OrderId = orderId,
                    BookId = item.BookId,
                    BookTitle = item.BookTitle,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.Quantity * item.UnitPrice,
                    CreatedOn = DateTime.Now,
                    CreatedBy = currentUserId ?? "Guest"
                };
                _context.OrderItems.Add(orderItem);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new DefaultResponseModel
            {
                Success = true,
                Statuscode = 200,
                Message = isCod ? "Cash on Delivery order confirmed successfully" : "Order placed and pending slip verification",
                Data = order
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new DefaultResponseModel
            {
                Success = false,
                Statuscode = 500,
                Message = ex.Message,
                Data = null
            });
        }
    }

    [HttpPut("{id}")]
    [EndpointSummary("Update Order")]
    public async Task<IActionResult> UpdateOrderAsync(string id, [FromBody] Order model)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var existingOrder = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id && !o.DeletedOn.HasValue);

            if (existingOrder == null)
            {
                return NotFound(new DefaultResponseModel
                {
                    Success = false,
                    Statuscode = 404,
                    Message = "Order not found",
                    Data = null
                });
            }

            string previousStatus = existingOrder.Status;
            string newStatus = model.Status ?? existingOrder.Status;

            // Handle stock transition if status changed in general update
            if (!string.Equals(previousStatus, newStatus, StringComparison.OrdinalIgnoreCase))
            {
                if (string.Equals(newStatus, "Cancelled", StringComparison.OrdinalIgnoreCase) && !string.Equals(previousStatus, "Cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    // Transitioning to Cancelled: restore stock
                    if (existingOrder.OrderItems != null)
                    {
                        foreach (var item in existingOrder.OrderItems)
                        {
                            await _context.Books
                                .Where(b => b.Id == item.BookId)
                                .ExecuteUpdateAsync(s => s.SetProperty(b => b.StockQuantity, b => b.StockQuantity + item.Quantity));
                        }
                    }
                }
                else if (string.Equals(previousStatus, "Cancelled", StringComparison.OrdinalIgnoreCase) && !string.Equals(newStatus, "Cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    // Transitioning from Cancelled to Active: deduct stock atomically
                    if (existingOrder.OrderItems != null)
                    {
                        var consolidated = existingOrder.OrderItems
                            .GroupBy(x => x.BookId)
                            .Select(g => new { BookId = g.Key, Quantity = g.Sum(x => x.Quantity), Title = g.First().BookTitle })
                            .ToList();

                        foreach (var item in consolidated)
                        {
                            int affected = await _context.Books
                                .Where(b => b.Id == item.BookId && b.StockQuantity >= item.Quantity)
                                .ExecuteUpdateAsync(s => s.SetProperty(b => b.StockQuantity, b => b.StockQuantity - item.Quantity));

                            if (affected == 0)
                            {
                                await transaction.RollbackAsync();
                                var book = await _context.Books.AsNoTracking().FirstOrDefaultAsync(b => b.Id == item.BookId);
                                return BadRequest(new DefaultResponseModel
                                {
                                    Success = false,
                                    Statuscode = 400,
                                    Message = $"Cannot re-activate order. Insufficient stock for '{book?.Title ?? item.Title ?? "item"}'.",
                                    Data = null
                                });
                            }
                        }
                    }
                }
            }

            existingOrder.CusName = model.CusName;
            existingOrder.CusEmail = model.CusEmail;
            existingOrder.CusPhone = model.CusPhone;
            existingOrder.ShippingAddress = model.ShippingAddress;
            existingOrder.ShippingCity = model.ShippingCity;
            existingOrder.ShippingTownship = model.ShippingTownship;
            existingOrder.SubTotal = model.SubTotal;
            existingOrder.ShippingFee = model.ShippingFee;
            existingOrder.Discount = model.Discount;
            existingOrder.TotalAmount = model.TotalAmount;
            existingOrder.Status = newStatus;
            existingOrder.UpdatedOn = DateTime.Now;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new DefaultResponseModel
            {
                Success = true,
                Statuscode = 200,
                Message = "Order updated successfully",
                Data = existingOrder
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new DefaultResponseModel
            {
                Success = false,
                Statuscode = 500,
                Message = ex.Message,
                Data = null
            });
        }
    }

    [HttpDelete("{id}")]
    [EndpointSummary("Delete Order (Soft Delete) with Stock Restoration")]
    public async Task<IActionResult> DeleteOrderAsync(string id)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var existingOrder = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id && !o.DeletedOn.HasValue);

            if (existingOrder == null)
            {
                return NotFound(new DefaultResponseModel
                {
                    Success = false,
                    Statuscode = 404,
                    Message = "Order not found",
                    Data = null
                });
            }

            // If order was active (not Cancelled), restore book stock before soft deleting
            if (!string.Equals(existingOrder.Status, "Cancelled", StringComparison.OrdinalIgnoreCase) && existingOrder.OrderItems != null)
            {
                foreach (var item in existingOrder.OrderItems)
                {
                    await _context.Books
                        .Where(b => b.Id == item.BookId)
                        .ExecuteUpdateAsync(s => s.SetProperty(b => b.StockQuantity, b => b.StockQuantity + item.Quantity));
                }
            }

            existingOrder.DeletedOn = DateTime.Now;
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new DefaultResponseModel
            {
                Success = true,
                Statuscode = 200,
                Message = "Order deleted successfully and stock restored if applicable",
                Data = null
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new DefaultResponseModel
            {
                Success = false,
                Statuscode = 500,
                Message = ex.Message,
                Data = null
            });
        }
    }

    [HttpPut("{id}/approve")]
    [EndpointSummary("Admin: Approve Pending Order")]
    public async Task<IActionResult> ApproveOrderAsync(string id)
    {
        var existingOrder = await _context.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == id && !o.DeletedOn.HasValue);
        if (existingOrder == null)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Order not found",
                Data = null
            });
        }

        if (string.Equals(existingOrder.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Cannot approve a cancelled order.",
                Data = null
            });
        }

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        existingOrder.Status = "Confirmed";
        existingOrder.UpdatedOn = DateTime.Now;
        existingOrder.UpdatedBy = currentUserId ?? "admin";

        await _context.SaveChangesAsync();
        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Order confirmed successfully",
            Data = existingOrder
        });
    }

    [HttpPut("{id}/reject")]
    [EndpointSummary("Admin: Reject Pending Order with Stock Restoration")]
    public async Task<IActionResult> RejectOrderAsync(string id)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var existingOrder = await _context.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == id && !o.DeletedOn.HasValue);
            if (existingOrder == null)
            {
                return NotFound(new DefaultResponseModel
                {
                    Success = false,
                    Statuscode = 404,
                    Message = "Order not found",
                    Data = null
                });
            }

            string previousStatus = existingOrder.Status;
            if (string.Equals(previousStatus, "Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new DefaultResponseModel
                {
                    Success = false,
                    Statuscode = 400,
                    Message = "Order is already cancelled",
                    Data = null
                });
            }

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            existingOrder.Status = "Cancelled";
            existingOrder.UpdatedOn = DateTime.Now;
            existingOrder.UpdatedBy = currentUserId ?? "admin";

            // Restore stock for cancelled order items atomically
            if (existingOrder.OrderItems != null && existingOrder.OrderItems.Count > 0)
            {
                foreach (var item in existingOrder.OrderItems)
                {
                    await _context.Books
                        .Where(b => b.Id == item.BookId)
                        .ExecuteUpdateAsync(s => s.SetProperty(b => b.StockQuantity, b => b.StockQuantity + item.Quantity));
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new DefaultResponseModel
            {
                Success = true,
                Statuscode = 200,
                Message = "Order rejected and stock restored successfully",
                Data = existingOrder
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new DefaultResponseModel
            {
                Success = false,
                Statuscode = 500,
                Message = ex.Message,
                Data = null
            });
        }
    }

    [HttpPut("{id}/status")]
    [EndpointSummary("Admin: Update Order Status (Confirmed, Shipped, Delivered, Cancelled) with Atomic Stock Sync")]
    public async Task<IActionResult> UpdateStatusAsync(string id, [FromQuery] string status)
    {
        var validStatuses = new[] { "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled" };
        var matchedStatus = validStatuses.FirstOrDefault(s => string.Equals(s, status, StringComparison.OrdinalIgnoreCase));
        if (matchedStatus == null)
        {
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = $"Invalid status '{status}'. Allowed: {string.Join(", ", validStatuses)}",
                Data = null
            });
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var existingOrder = await _context.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.Id == id && !o.DeletedOn.HasValue);
            if (existingOrder == null)
            {
                return NotFound(new DefaultResponseModel
                {
                    Success = false,
                    Statuscode = 404,
                    Message = "Order not found",
                    Data = null
                });
            }

            string previousStatus = existingOrder.Status;
            if (string.Equals(previousStatus, matchedStatus, StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new DefaultResponseModel
                {
                    Success = true,
                    Statuscode = 200,
                    Message = $"Order is already {matchedStatus}",
                    Data = existingOrder
                });
            }

            existingOrder.Status = matchedStatus;
            existingOrder.UpdatedOn = DateTime.Now;
            existingOrder.UpdatedBy = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "admin";

            // If newly marked as Cancelled, restore book stock atomically
            if (string.Equals(matchedStatus, "Cancelled", StringComparison.OrdinalIgnoreCase) && !string.Equals(previousStatus, "Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                if (existingOrder.OrderItems != null)
                {
                    foreach (var item in existingOrder.OrderItems)
                    {
                        await _context.Books
                            .Where(b => b.Id == item.BookId)
                            .ExecuteUpdateAsync(s => s.SetProperty(b => b.StockQuantity, b => b.StockQuantity + item.Quantity));
                    }
                }
            }
            // If reactivating a Cancelled order, re-deduct book stock atomically with race-condition check
            else if (string.Equals(previousStatus, "Cancelled", StringComparison.OrdinalIgnoreCase) && !string.Equals(matchedStatus, "Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                if (existingOrder.OrderItems != null)
                {
                    var consolidated = existingOrder.OrderItems
                        .GroupBy(x => x.BookId)
                        .Select(g => new { BookId = g.Key, Quantity = g.Sum(x => x.Quantity), Title = g.First().BookTitle })
                        .ToList();

                    foreach (var item in consolidated)
                    {
                        int affected = await _context.Books
                            .Where(b => b.Id == item.BookId && b.StockQuantity >= item.Quantity)
                            .ExecuteUpdateAsync(s => s.SetProperty(b => b.StockQuantity, b => b.StockQuantity - item.Quantity));

                        if (affected == 0)
                        {
                            await transaction.RollbackAsync();
                            var book = await _context.Books.AsNoTracking().FirstOrDefaultAsync(b => b.Id == item.BookId);
                            return BadRequest(new DefaultResponseModel
                            {
                                Success = false,
                                Statuscode = 400,
                                Message = $"Cannot re-activate order. Insufficient stock for '{book?.Title ?? item.Title ?? "item"}' (Available: {book?.StockQuantity ?? 0}, Required: {item.Quantity}).",
                                Data = null
                            });
                        }
                    }
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new DefaultResponseModel
            {
                Success = true,
                Statuscode = 200,
                Message = $"Order status updated to {matchedStatus}",
                Data = existingOrder
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new DefaultResponseModel
            {
                Success = false,
                Statuscode = 500,
                Message = ex.Message,
                Data = null
            });
        }
    }

    [HttpGet("pending")]
    [EndpointSummary("Get Pending Orders (for admin notification)")]
    public async Task<IActionResult> GetPendingAsync()
    {
        var data = await _repo.Orders.GetAsync(x => x.Status == "Pending" && !x.DeletedOn.HasValue);
        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Success",
            Data = data
        });
    }
}
