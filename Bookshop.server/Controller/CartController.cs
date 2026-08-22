using System.Security.Claims;
using Bookshop.Entities;
using Bookshop.Interfaces.Repositories;
using Bookshop.Models;
using Microsoft.AspNetCore.Mvc;

namespace Bookshop.Controller;

[Route("api/[controller]")]
[ApiController]
public class CartController(IRepositoryWrapper repo) : ControllerBase
{
    private readonly IRepositoryWrapper _repo = repo ?? throw new Exception("Repo is null");

    [HttpGet("{id}")]
    [EndpointSummary("Get Cart by Id with Items")]
    public async Task<IActionResult> GetCartByIdAsync(int id)
    {
        var cart = await _repo.Carts.GetByIdAsync(id);
        if (cart == null)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Cart not found",
                Data = null
            });
        }

        var items = await _repo.CartItems.GetAsync(x => x.CartId == id && !x.DeletedOn.HasValue);

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Success",
            Data = new
            {
                Cart = cart,
                Items = items
            }
        });
    }

    [HttpGet("user")]
    [EndpointSummary("Get or Create Cart for Authenticated User / Guest")]
    public async Task<IActionResult> GetUserCartAsync()
    {
        int? currentUserId = null;
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsedUserId))
        {
            currentUserId = parsedUserId;
        }

        if (!currentUserId.HasValue)
        {
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "User is not authenticated. Use cart ID for guest mode.",
                Data = null
            });
        }

        var carts = await _repo.Carts.GetAsync(x => x.UserId == currentUserId.Value);
        Cart? cart = carts?.FirstOrDefault();

        if (cart == null)
        {
            cart = new Cart
            {
                UserId = currentUserId.Value,
                CreatedOn = DateTime.Now
            };
            _repo.Carts.Create(cart);
            await _repo.SaveAsync();
        }

        var items = await _repo.CartItems.GetAsync(x => x.CartId == cart.Id && !x.DeletedOn.HasValue);

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Success",
            Data = new
            {
                Cart = cart,
                Items = items
            }
        });
    }

    [HttpPost]
    [EndpointSummary("Create Cart (Supports Authenticated & Guest Mode)")]
    public async Task<IActionResult> CreateCartAsync([FromBody] Cart? model)
    {
        try
        {
            int? currentUserId = null;
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsedUserId))
            {
                currentUserId = parsedUserId;
            }

            Cart cart = new Cart
            {
                UserId = currentUserId ?? model?.UserId, // null for guest
                CreatedOn = DateTime.Now
            };

            _repo.Carts.Create(cart);

            return await _repo.SaveAsync()
                ? Ok(new DefaultResponseModel
                {
                    Success = true,
                    Statuscode = 200,
                    Message = "Cart created successfully",
                    Data = cart
                })
                : BadRequest(new DefaultResponseModel
                {
                    Success = false,
                    Statuscode = 400,
                    Message = "Failed to create cart",
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

    [HttpPost("items")]
    [EndpointSummary("Add Item to Cart")]
    public async Task<IActionResult> AddItemAsync([FromBody] CartItem model)
    {
        try
        {
            var cart = await _repo.Carts.GetByIdAsync(model.CartId);
            if (cart == null)
            {
                return NotFound(new DefaultResponseModel
                {
                    Success = false,
                    Statuscode = 404,
                    Message = "Cart not found",
                    Data = null
                });
            }

            var existingItems = await _repo.CartItems.GetAsync(x => x.CartId == model.CartId && x.BookId == model.BookId && !x.DeletedOn.HasValue);
            var existingItem = existingItems?.FirstOrDefault();

            if (existingItem != null)
            {
                existingItem.Quantity += model.Quantity > 0 ? model.Quantity : 1;
                existingItem.UpdatedOn = DateTime.Now;
                _repo.CartItems.Update(existingItem);
            }
            else
            {
                existingItem = new CartItem
                {
                    CartId = model.CartId,
                    BookId = model.BookId,
                    Quantity = model.Quantity > 0 ? model.Quantity : 1,
                    CreatedOn = DateTime.Now
                };
                _repo.CartItems.Create(existingItem);
            }

            return await _repo.SaveAsync()
                ? Ok(new DefaultResponseModel
                {
                    Success = true,
                    Statuscode = 200,
                    Message = "Item added to cart successfully",
                    Data = existingItem
                })
                : BadRequest(new DefaultResponseModel
                {
                    Success = false,
                    Statuscode = 400,
                    Message = "Failed to add item to cart",
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

    [HttpPut("items/{id}")]
    [EndpointSummary("Update Cart Item Quantity")]
    public async Task<IActionResult> UpdateItemQuantityAsync(int id, [FromBody] CartItem model)
    {
        var item = await _repo.CartItems.GetByIdAsync(id);
        if (item == null || item.DeletedOn.HasValue)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Cart item not found",
                Data = null
            });
        }

        if (model.Quantity <= 0)
        {
            item.DeletedOn = DateTime.Now;
        }
        else
        {
            item.Quantity = model.Quantity;
            item.UpdatedOn = DateTime.Now;
        }

        _repo.CartItems.Update(item);

        return await _repo.SaveAsync()
            ? Ok(new DefaultResponseModel
            {
                Success = true,
                Statuscode = 200,
                Message = "Cart item updated successfully",
                Data = item
            })
            : BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Failed to update cart item",
                Data = null
            });
    }

    [HttpDelete("items/{id}")]
    [EndpointSummary("Remove Item from Cart (Soft Delete)")]
    public async Task<IActionResult> RemoveItemAsync(int id)
    {
        var item = await _repo.CartItems.GetByIdAsync(id);
        if (item == null || item.DeletedOn.HasValue)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Cart item not found",
                Data = null
            });
        }

        item.DeletedOn = DateTime.Now;
        _repo.CartItems.Update(item);

        return await _repo.SaveAsync()
            ? Ok(new DefaultResponseModel
            {
                Success = true,
                Statuscode = 200,
                Message = "Cart item removed successfully",
                Data = null
            })
            : BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Failed to remove cart item",
                Data = null
            });
    }

    [HttpDelete("{id}/clear")]
    [EndpointSummary("Clear all items from Cart")]
    public async Task<IActionResult> ClearCartAsync(int id)
    {
        var items = await _repo.CartItems.GetAsync(x => x.CartId == id && !x.DeletedOn.HasValue);
        if (items != null && items.Count > 0)
        {
            foreach (var item in items)
            {
                item.DeletedOn = DateTime.Now;
                _repo.CartItems.Update(item);
            }
            await _repo.SaveAsync();
        }

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Cart cleared successfully",
            Data = null
        });
    }
}
