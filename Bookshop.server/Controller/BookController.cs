using Bookshop.Data;
using Bookshop.Entities;
using Bookshop.Interfaces.Repositories;
using Bookshop.Models;
using System.Linq.Dynamic.Core;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bookshop.Controller;

[Route("api/[controller]")]
[ApiController]
public class BookController(IRepositoryWrapper repo, BookshopDbContext context) : ControllerBase
{
    private readonly IRepositoryWrapper _repo = repo ?? throw new Exception("Repo is null");
    private readonly BookshopDbContext _context = context ?? throw new Exception("Context is null");

    [HttpGet]
    [EndpointSummary("Get Book List with Pagination")]
    public async Task<IActionResult> GetAsync(int skipRows, int pageSize, string? q, string? sortField, int order)
    {

        IQueryable<Book> booksQuery = BookQuery( q, sortField, order);

        int recordsTotal = await booksQuery.CountAsync();
        List<Book> records = await booksQuery
            .AsNoTracking()
            .Skip(skipRows)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = StatusCodes.Status200OK,
            Message = "success pagination",
            Data = new { records, recordsTotal }
        });
    }

    [HttpGet("{id}")]
    [EndpointSummary("Get Book by Id")]
    public async Task<IActionResult> GetAsync(int id)
    {
        IReadOnlyList<Book>? data = await _repo.Books.GetAsync(x => x.Id == id);
        if (data == null || data.Count == 0)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Book not found",
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
    [EndpointSummary("Create Book")]
    public async Task<IActionResult> CreateBook([FromBody] Book model)
    {
        try
        {
            Book data = new Book
            {
                Title = model.Title,
                AuthorId = model.AuthorId,
                Slug = model.Slug,
                Description = model.Description,
                OriginalPrice = model.OriginalPrice,
                Price = model.Price,
                CategoryId = model.CategoryId,
                StockQuantity = model.StockQuantity,
                ImageUrl = model.ImageUrl,
                Isbn = model.Isbn,
                PublishedDate = model.PublishedDate,
                PageCount = model.PageCount,
                Publisher = model.Publisher,
                Language = model.Language,
                CreatedOn = DateTime.Now
            };
            _repo.Books.Create(data);
            return await _repo.SaveAsync()
                ? Ok(new DefaultResponseModel
                {
                    Success = true,
                    Statuscode = 200,
                    Message = "Book created successfully",
                    Data = data
                })
                : BadRequest(new DefaultResponseModel
                {
                    Success = false,
                    Statuscode = 400,
                    Message = "Failed to create book",
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
    [EndpointSummary("Update Book")]
    public async Task<IActionResult> UpdateBookAsync(int id, [FromBody] Book model)
    {
        var existingBook = await _repo.Books.GetByIdAsync(id);
        if (existingBook == null || existingBook.DeletedOn.HasValue)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Book not found",
                Data = null
            });
        }

        existingBook.Title = model.Title;
        existingBook.AuthorId = model.AuthorId;
        existingBook.Slug = model.Slug;
        existingBook.Description = model.Description;
        existingBook.OriginalPrice = model.OriginalPrice;
        existingBook.Price = model.Price;
        existingBook.CategoryId = model.CategoryId;
        existingBook.StockQuantity = model.StockQuantity;
        existingBook.ImageUrl = model.ImageUrl;
        existingBook.Isbn = model.Isbn;
        existingBook.PublishedDate = model.PublishedDate;
        existingBook.PageCount = model.PageCount;
        existingBook.Publisher = model.Publisher;
        existingBook.Language = model.Language;
        existingBook.UpdatedOn = DateTime.Now;

        _repo.Books.Update(existingBook);
        return await _repo.SaveAsync()
            ? Ok(new DefaultResponseModel
            {
                Success = true,
                Statuscode = 200,
                Message = "Book updated successfully",
                Data = existingBook
            })
            : BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Failed to update book",
                Data = null
            });
    }

    [HttpDelete("{id}")]
    [EndpointSummary("Delete Book (Soft Delete)")]
    public async Task<IActionResult> DeleteBookAsync(int id)
    {
        var existingBook = await _repo.Books.GetByIdAsync(id);
        if (existingBook == null || existingBook.DeletedOn.HasValue)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Book not found",
                Data = null
            });
        }

        existingBook.DeletedOn = DateTime.Now;
        _repo.Books.Update(existingBook);
        return await _repo.SaveAsync()
            ? Ok(new DefaultResponseModel
            {
                Success = true,
                Statuscode = 200,
                Message = "Book deleted successfully",
                Data = null
            })
            : BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Failed to delete book",
                Data = null
            });
    }

    [NonAction]
    private IQueryable<Book> BookQuery(string? q, string? sortField, int order)
    {
        IQueryable<Book> query = _context.Books.Where(x => !x.DeletedOn.HasValue);

        //if (sDate.HasValue && eDate.HasValue)
        //{
        //    query = query.Where(x => x.CreatedOn >= sDate.Value && x.CreatedOn <= eDate.Value.AddDays(1));
        //}

        if (!string.IsNullOrWhiteSpace(q))
        {
            string search = q.Trim().ToLower();
            query = query.Where(x => (x.Title != null && x.Title.ToLower().Contains(search))
                                  //|| (x.Author != null && x.Author.ToLower().Contains(search))
                                  || (x.Isbn != null && x.Isbn.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(sortField))
        {
            query = query.OrderBy($"{sortField} {(order > 0 ? "ascending" : "descending")}");
        }

        return query;
    }
}