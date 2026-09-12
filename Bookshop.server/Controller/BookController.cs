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
    [EndpointSummary("Get Book List with Pagination and Filters")]
    public async Task<IActionResult> GetAsync(
        int skipRows = 0,
        int pageSize = 50,
        int? categoryId = null,
        string? q = null,
        string? sortField = null,
        int order = 1,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        string? author = null,
        bool? inStockOnly = null,
        DateTime? fromDate = null,
        DateTime? toDate = null)
    {
        if (pageSize <= 0) pageSize = 50;
        if (skipRows < 0) skipRows = 0;

        IQueryable<Book> booksQuery = BookQuery(q, categoryId, sortField, order, minPrice, maxPrice, author, inStockOnly, fromDate, toDate);

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

    [HttpGet("filter-metadata")]
    [EndpointSummary("Get authors and price range metadata for catalog filtering")]
    public async Task<IActionResult> GetFilterMetadataAsync()
    {
        var activeBooks = _context.Books.Where(b => !b.DeletedOn.HasValue);

        var authors = await activeBooks
            .Where(b => !string.IsNullOrEmpty(b.Author))
            .GroupBy(b => b.Author!)
            .Select(g => new { author = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .Take(30)
            .ToListAsync();

        var minPrice = await activeBooks.AnyAsync() ? await activeBooks.MinAsync(b => b.Price) : 0;
        var maxPrice = await activeBooks.AnyAsync() ? await activeBooks.MaxAsync(b => b.Price) : 0;
        var totalBooks = await activeBooks.CountAsync();

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = StatusCodes.Status200OK,
            Message = "Filter metadata retrieved successfully",
            Data = new { authors, minPrice, maxPrice, totalBooks }
        });
    }

    [HttpPost("upload-image")]
    [EndpointSummary("Upload Book Cover Image")]
    public async Task<IActionResult> UploadImageAsync([FromForm] IFormFile file)
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

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(ext))
        {
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Invalid image file type. Allowed: .jpg, .jpeg, .png, .webp, .gif",
                Data = null
            });
        }

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "books");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var request = HttpContext.Request;
        var imageUrl = $"{request.Scheme}://{request.Host}/uploads/books/{uniqueFileName}";

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Image uploaded successfully",
            Data = new { url = imageUrl, fileName = uniqueFileName }
        });
    }

    [HttpGet("{id}")]
    [EndpointSummary("Get Book by Id")]
    public async Task<IActionResult> GetAsync(int id)
    {
        IReadOnlyList<Book>? data = await _repo.Books.GetAsync(x => x.Id == id && !x.DeletedOn.HasValue);
        var book = data?.FirstOrDefault();
        if (book == null)
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
            Data = book
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
                Author = model.Author,
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
        existingBook.Author = model.Author;
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
    private IQueryable<Book> BookQuery(
        string? q,
        int? categoryId,
        string? sortField,
        int order,
        decimal? minPrice = null,
        decimal? maxPrice = null,
        string? author = null,
        bool? inStockOnly = null,
        DateTime? fromDate = null,
        DateTime? toDate = null)
    {
        IQueryable<Book> query = _context.Books.Where(x => !x.DeletedOn.HasValue);

        if (categoryId.HasValue && categoryId.Value > 0)
        {
            query = query.Where(x => x.CategoryId == categoryId.Value);
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

        if (!string.IsNullOrWhiteSpace(author))
        {
            string authorSearch = author.Trim().ToLower();
            query = query.Where(x => x.Author != null && x.Author.ToLower().Contains(authorSearch));
        }

        if (minPrice.HasValue && minPrice.Value > 0)
        {
            query = query.Where(x => x.Price >= minPrice.Value);
        }

        if (maxPrice.HasValue && maxPrice.Value > 0)
        {
            query = query.Where(x => x.Price <= maxPrice.Value);
        }

        if (inStockOnly.HasValue && inStockOnly.Value)
        {
            query = query.Where(x => x.StockQuantity > 0);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            string search = q.Trim().ToLower();
            query = query.Where(x => (x.Title != null && x.Title.ToLower().Contains(search))
                                  || (x.Author != null && x.Author.ToLower().Contains(search))
                                  || (x.Isbn != null && x.Isbn.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(sortField))
        {
            query = query.OrderBy($"{sortField} {(order > 0 ? "ascending" : "descending")}");
        }

        return query;
    }
}