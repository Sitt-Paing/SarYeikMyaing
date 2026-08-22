using System.Security.Claims;
using Bookshop.Entities;
using Bookshop.Interfaces.Repositories;
using Bookshop.Models;
using Microsoft.AspNetCore.Mvc;

namespace Bookshop.Controller;

[Route("api/[controller]")]
[ApiController]
public class OrderController(IRepositoryWrapper repo) : ControllerBase
{
    private readonly IRepositoryWrapper _repo = repo ?? throw new Exception("Repo is null");

    [HttpGet]
    [EndpointSummary("Get Order List")]
    public async Task<IActionResult> GetAsync()
    {
        var data = await _repo.Orders.GetAsync(x => !x.DeletedOn.HasValue);
        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Success",
            Data = data
        });
    }

    [HttpGet("{id}")]
    [EndpointSummary("Get Order by Id")]
    public async Task<IActionResult> GetAsync(string id)
    {
        var data = await _repo.Orders.GetByIdAsync(id);
        if (data == null || data.DeletedOn.HasValue)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Order not found",
                Data = null
            });
        }

        var orderItems = await _repo.OrderItems.GetAsync(x => x.OrderId == id && !x.DeletedOn.HasValue);

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Success",
            Data = new
            {
                Order = data,
                OrderItems = orderItems
            }
        });
    }

    [HttpGet("user/{userId}")]
    [EndpointSummary("Get Orders by User Id")]
    public async Task<IActionResult> GetByUserIdAsync(int userId)
    {
        var data = await _repo.Orders.GetAsync(x => x.UserId == userId && !x.DeletedOn.HasValue);
        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Success",
            Data = data
        });
    }

    [HttpPost]
    [EndpointSummary("Create Order (Supports Authenticated & Guest Mode)")]
    public async Task<IActionResult> CreateAsync([FromBody] Order model)
    {
        try
        {
            // Optional authentication: resolve user id from claims if logged in
            int? currentUserId = null;
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsedUserId))
            {
                currentUserId = parsedUserId;
            }

            string orderId = string.IsNullOrWhiteSpace(model.Id) ? Guid.NewGuid().ToString() : model.Id;
            string orderNumber = string.IsNullOrWhiteSpace(model.OrderNumber)
                ? $"ORD-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}"
                : model.OrderNumber;

            Order order = new Order
            {
                Id = orderId,
                OrderNumber = orderNumber,
                UserId = currentUserId ?? model.UserId, // null for guest mode
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
                Status = string.IsNullOrWhiteSpace(model.Status) ? "Pending" : model.Status,
                CreatedOn = DateTime.Now,
                CreatedBy = currentUserId?.ToString() ?? "Guest"
            };

            _repo.Orders.Create(order);

            // If order items were passed in
            if (model.OrderItems != null && model.OrderItems.Count > 0)
            {
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
                        CreatedBy = currentUserId?.ToString() ?? "Guest"
                    };
                    _repo.OrderItems.Create(orderItem);
                }
            }

            return await _repo.SaveAsync()
                ? Ok(new DefaultResponseModel
                {
                    Success = true,
                    Statuscode = 200,
                    Message = "Order created successfully",
                    Data = order
                })
                : BadRequest(new DefaultResponseModel
                {
                    Success = false,
                    Statuscode = 400,
                    Message = "Failed to create order",
                    Data = null
                });
        }
        catch (Exception ex)
        {
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
        var existingOrder = await _repo.Orders.GetByIdAsync(id);
        if (existingOrder == null || existingOrder.DeletedOn.HasValue)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Order not found",
                Data = null
            });
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
        existingOrder.Status = model.Status;
        existingOrder.UpdatedOn = DateTime.Now;

        _repo.Orders.Update(existingOrder);
        return await _repo.SaveAsync()
            ? Ok(new DefaultResponseModel
            {
                Success = true,
                Statuscode = 200,
                Message = "Order updated successfully",
                Data = existingOrder
            })
            : BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Failed to update order",
                Data = null
            });
    }

    [HttpDelete("{id}")]
    [EndpointSummary("Delete Order (Soft Delete)")]
    public async Task<IActionResult> DeleteOrderAsync(string id)
    {
        var existingOrder = await _repo.Orders.GetByIdAsync(id);
        if (existingOrder == null || existingOrder.DeletedOn.HasValue)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Order not found",
                Data = null
            });
        }

        existingOrder.DeletedOn = DateTime.Now;
        _repo.Orders.Update(existingOrder);
        return await _repo.SaveAsync()
            ? Ok(new DefaultResponseModel
            {
                Success = true,
                Statuscode = 200,
                Message = "Order deleted successfully",
                Data = null
            })
            : BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Failed to delete order",
                Data = null
            });
    }
}
