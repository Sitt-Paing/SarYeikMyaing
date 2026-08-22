using Bookshop.Data;
using Bookshop.Entities;
using Bookshop.Interfaces.Repositories;
using Bookshop.Services.Repositories.Base;

namespace Bookshop.Services.Repositories;

public class BookRepo(BookshopDbContext context) : RepositoryBase<Book>(context), IBookRepo
{
    private readonly BookshopDbContext _context = context;
}