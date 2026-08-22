using Bookshop.Entities;
using Bookshop.Interfaces.Repositories;
using Bookshop.Models;
using Microsoft.AspNetCore.Mvc;

namespace Bookshop.Controller;

[Route("api/[controller]")]
[ApiController]
public class AuthorController(IRepositoryWrapper repo) : ControllerBase
{
    private readonly IRepositoryWrapper _repo = repo ?? throw new Exception("Repo is null");

    [HttpGet]
    [EndpointSummary("Get Author List")]
    public async Task<IActionResult> GetAsync()
    {
        var data = await _repo.Authors.GetAsync(x => !x.DeletedOn.HasValue);
        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Success",
            Data = data
        });
    }

    [HttpGet("{id}")]
    [EndpointSummary("Get Author by Id")]
    public async Task<IActionResult> GetAsync(int id)
    {
        var data = await _repo.Authors.GetByIdAsync(id);
        if (data == null || data.DeletedOn.HasValue)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Author not found",
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

    [HttpPost]
    [EndpointSummary("Create Author")]
    public async Task<IActionResult> CreateAsync([FromBody] Author model)
    {
        try
        {
            Author data = new Author
            {
                Name = model.Name,
                Biography = model.Biography,
                ImageUrl = model.ImageUrl,
                IsActive = model.IsActive ?? true,
                CreatedOn = DateTime.Now
            };
            _repo.Authors.Create(data);

            return await _repo.SaveAsync()
                ? Ok(new DefaultResponseModel
                {
                    Success = true,
                    Statuscode = 200,
                    Message = "Author created successfully",
                    Data = data
                })
                : BadRequest(new DefaultResponseModel
                {
                    Success = false,
                    Statuscode = 400,
                    Message = "Failed to create author",
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
    [EndpointSummary("Update Author")]
    public async Task<IActionResult> UpdateAuthorAsync(int id, [FromBody] Author model)
    {
        var existingAuthor = await _repo.Authors.GetByIdAsync(id);
        if (existingAuthor == null || existingAuthor.DeletedOn.HasValue)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Author not found",
                Data = null
            });
        }

        existingAuthor.Name = model.Name;
        existingAuthor.Biography = model.Biography;
        existingAuthor.ImageUrl = model.ImageUrl;
        existingAuthor.IsActive = model.IsActive;
        existingAuthor.UpdatedOn = DateTime.Now;

        _repo.Authors.Update(existingAuthor);
        return await _repo.SaveAsync()
            ? Ok(new DefaultResponseModel
            {
                Success = true,
                Statuscode = 200,
                Message = "Author updated successfully",
                Data = existingAuthor
            })
            : BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Failed to update author",
                Data = null
            });
    }

    [HttpDelete("{id}")]
    [EndpointSummary("Delete Author (Soft Delete)")]
    public async Task<IActionResult> DeleteAuthorAsync(int id)
    {
        var existingAuthor = await _repo.Authors.GetByIdAsync(id);
        if (existingAuthor == null || existingAuthor.DeletedOn.HasValue)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Author not found",
                Data = null
            });
        }

        existingAuthor.DeletedOn = DateTime.Now;
        _repo.Authors.Update(existingAuthor);
        return await _repo.SaveAsync()
            ? Ok(new DefaultResponseModel
            {
                Success = true,
                Statuscode = 200,
                Message = "Author deleted successfully",
                Data = null
            })
            : BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Failed to delete author",
                Data = null
            });
    }
}
