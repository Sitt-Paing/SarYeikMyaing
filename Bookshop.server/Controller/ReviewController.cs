using Bookshop.Data;
using Bookshop.Entities;
using Bookshop.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Bookshop.Controller;

[Route("api/[controller]")]
[ApiController]
public class ReviewController(BookshopDbContext context) : ControllerBase
{
    private readonly BookshopDbContext _context = context ?? throw new ArgumentNullException(nameof(context));

    [HttpGet("book/{bookId:int}")]
    [EndpointSummary("Get all reviews and rating breakdown for a book")]
    public async Task<IActionResult> GetByBookIdAsync(int bookId)
    {
        var reviews = await _context.Reviews
            .AsNoTracking()
            .Where(r => r.BookId == bookId)
            .OrderByDescending(r => r.CreatedOn)
            .ToListAsync();

        int totalReviews = reviews.Count;
        double averageRating = totalReviews > 0 ? Math.Round(reviews.Average(r => r.Rating), 1) : 0.0;

        var ratingDistribution = new Dictionary<int, int>
        {
            { 5, reviews.Count(r => r.Rating == 5) },
            { 4, reviews.Count(r => r.Rating == 4) },
            { 3, reviews.Count(r => r.Rating == 3) },
            { 2, reviews.Count(r => r.Rating == 2) },
            { 1, reviews.Count(r => r.Rating == 1) },
        };

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = StatusCodes.Status200OK,
            Message = "Reviews retrieved successfully",
            Data = new
            {
                reviews,
                summary = new
                {
                    averageRating,
                    totalReviews,
                    ratingDistribution
                }
            }
        });
    }

    public record CreateReviewDto(int BookId, int Rating, string? Comment, string? UserName);

    [HttpPost]
    [EndpointSummary("Submit a new book review")]
    public async Task<IActionResult> CreateAsync([FromBody] CreateReviewDto dto)
    {
        if (dto.BookId <= 0)
        {
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Invalid Book ID.",
                Data = null
            });
        }

        if (dto.Rating < 1 || dto.Rating > 5)
        {
            return BadRequest(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 400,
                Message = "Rating must be between 1 and 5 stars.",
                Data = null
            });
        }

        var bookExists = await _context.Books.AnyAsync(b => b.Id == dto.BookId && !b.DeletedOn.HasValue);
        if (!bookExists)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Book not found.",
                Data = null
            });
        }

        string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        string userName = dto.UserName?.Trim() ?? "";

        if (string.IsNullOrWhiteSpace(userName))
        {
            userName = User.Identity?.Name ?? "Reader";
        }

        var review = new Review
        {
            BookId = dto.BookId,
            UserId = userId,
            UserName = userName,
            Rating = dto.Rating,
            Comment = dto.Comment?.Trim(),
            CreatedOn = DateTime.UtcNow
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = StatusCodes.Status200OK,
            Message = "Review submitted successfully",
            Data = review
        });
    }

    [HttpDelete("{id:int}")]
    [EndpointSummary("Delete a review")]
    public async Task<IActionResult> DeleteAsync(int id)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null)
        {
            return NotFound(new DefaultResponseModel
            {
                Success = false,
                Statuscode = 404,
                Message = "Review not found.",
                Data = null
            });
        }

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        return Ok(new DefaultResponseModel
        {
            Success = true,
            Statuscode = 200,
            Message = "Review deleted successfully",
            Data = null
        });
    }
}
