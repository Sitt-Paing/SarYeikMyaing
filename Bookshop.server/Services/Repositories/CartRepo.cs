using Bookshop.Data;
using Bookshop.Entities;
using Bookshop.Interfaces.Repositories;
using Bookshop.Services.Repositories.Base;

namespace Bookshop.Services.Repositories;

public class CartRepo(BookshopDbContext context) : RepositoryBase<Cart>(context), ICartRepo
{
    private readonly BookshopDbContext _context = context;
}
