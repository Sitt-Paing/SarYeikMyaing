using Bookshop.Entities;
using Bookshop.Interfaces.Repositories;
using Bookshop.Models;
using Microsoft.AspNetCore.Mvc;

namespace Bookshop.Controller;

[Route("api/[controller]")]
[ApiController]
public class PaymentController(IRepositoryWrapper repo) : ControllerBase
{
    private readonly IRepositoryWrapper _repo = repo ?? throw new Exception("Repo is null");

    [HttpGet]
    [EndpointSummary("Get Payment List")]
    public async Task<IActionResult> GetAsync()
    {
        var data = await _repo.Payments.GetAsync();
        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Success",
            Data = data
        });
    }

    [HttpGet("{id}")]
    [EndpointSummary("Get Payment by Id")]
    public async Task<IActionResult> GetAsync(string id)
    {
        var data = await _repo.Payments.GetByIdAsync(id);
        if (data == null)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Payment not found",
                Data = null
            });
        }
        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Success",
            Data = data
        });
    }

    [HttpGet("order/{orderId}")]
    [EndpointSummary("Get Payments by Order Id")]
    public async Task<IActionResult> GetByOrderIdAsync(string orderId)
    {
        var data = await _repo.Payments.GetAsync(x => x.OrderId == orderId);
        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Success",
            Data = data
        });
    }

    [HttpPost]
    [EndpointSummary("Create Payment")]
    public async Task<IActionResult> CreateAsync([FromBody] Payment model)
    {
        try
        {
            string paymentId = string.IsNullOrWhiteSpace(model.Id) ? Guid.NewGuid().ToString() : model.Id;
            string transactionId = string.IsNullOrWhiteSpace(model.TransactionId)
                ? $"TXN-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}"
                : model.TransactionId;

            Payment data = new Payment
            {
                Id = paymentId,
                OrderId = model.OrderId,
                PaymentMethod = model.PaymentMethod,
                TransactionId = transactionId,
                Amount = model.Amount,
                Status = string.IsNullOrWhiteSpace(model.Status) ? "Completed" : model.Status,
                PaidOn = model.PaidOn == default ? DateTime.Now : model.PaidOn,
                CreatedOn = DateTime.Now
            };

            _repo.Payments.Create(data);

            return await _repo.SaveAsync()
                ? Ok(new DefaultResponseModel
                {
                    Success = true,
                    Statuscode = 200,
                    Message = "Payment created successfully",
                    Data = data
                })
                : BadRequest(new DefaultResponseModel
                {
                    Success = false,
                    Statuscode = 400,
                    Message = "Failed to create payment",
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
    [EndpointSummary("Update Payment")]
    public async Task<IActionResult> UpdatePaymentAsync(string id, [FromBody] Payment model)
    {
        var existingPayment = await _repo.Payments.GetByIdAsync(id);
        if (existingPayment == null)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Payment not found",
                Data = null
            });
        }

        existingPayment.PaymentMethod = model.PaymentMethod;
        existingPayment.TransactionId = model.TransactionId;
        existingPayment.Amount = model.Amount;
        existingPayment.Status = model.Status;
        if (model.PaidOn != default)
        {
            existingPayment.PaidOn = model.PaidOn;
        }

        _repo.Payments.Update(existingPayment);

        return await _repo.SaveAsync()
            ? Ok(new DefaultResponseModel
            {
                Success = true,
                Statuscode = 200,
                Message = "Payment updated successfully",
                Data = existingPayment
            })
            : BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Failed to update payment",
                Data = null
            });
    }

    [HttpDelete("{id}")]
    [EndpointSummary("Delete Payment")]
    public async Task<IActionResult> DeletePaymentAsync(string id)
    {
        var existingPayment = await _repo.Payments.GetByIdAsync(id);
        if (existingPayment == null)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Payment not found",
                Data = null
            });
        }

        _repo.Payments.Delete(existingPayment);

        return await _repo.SaveAsync()
            ? Ok(new DefaultResponseModel
            {
                Success = true,
                Statuscode = 200,
                Message = "Payment deleted successfully",
                Data = null
            })
            : BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Failed to delete payment",
                Data = null
            });
    }
}
