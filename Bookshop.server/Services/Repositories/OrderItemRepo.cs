using Bookshop.Data;
using Bookshop.Entities;
using Bookshop.Interfaces.Repositories;
using Bookshop.Services.Repositories.Base;

namespace Bookshop.Services.Repositories;

public class OrderItemRepo(BookshopDbContext context) : RepositoryBase<OrderItem>(context), IOrderItemRepo
{
    private readonly BookshopDbContext _context = context;
}
