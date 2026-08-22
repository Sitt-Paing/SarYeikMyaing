using Bookshop.Data;
using Bookshop.Entities;
using Bookshop.Interfaces.Repositories;
using Bookshop.Services.Repositories.Base;

namespace Bookshop.Services.Repositories;

public class OrderRepo(BookshopDbContext context) : RepositoryBase<Order>(context), IOrderRepo
{
    private readonly BookshopDbContext _context = context;
}
