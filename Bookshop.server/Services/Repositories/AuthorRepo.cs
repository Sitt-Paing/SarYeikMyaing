using Bookshop.Data;
using Bookshop.Entities;
using Bookshop.Interfaces.Repositories;
using Bookshop.Services.Repositories.Base;

namespace Bookshop.Services.Repositories;

public class AuthorRepo(BookshopDbContext context) : RepositoryBase<Author>(context), IAuthorRepo
{
    private readonly BookshopDbContext _context = context;
}
