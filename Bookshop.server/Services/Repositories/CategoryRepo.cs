using Bookshop.Data;
using Bookshop.Entities;
using Bookshop.Interfaces.Repositories;
using Bookshop.Services.Repositories.Base;

namespace Bookshop.Services.Repositories;

public class CategoryRepo (BookshopDbContext context): RepositoryBase<Category>(context), ICategoryRepo
{
    private readonly BookshopDbContext _context = context;
}