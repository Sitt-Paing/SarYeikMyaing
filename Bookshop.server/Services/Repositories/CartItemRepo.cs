using Bookshop.Data;
using Bookshop.Entities;
using Bookshop.Interfaces.Repositories;
using Bookshop.Services.Repositories.Base;

namespace Bookshop.Services.Repositories;

public class CartItemRepo(BookshopDbContext context) : RepositoryBase<CartItem>(context), ICartItemRepo
{
    private readonly BookshopDbContext _context = context;
}
