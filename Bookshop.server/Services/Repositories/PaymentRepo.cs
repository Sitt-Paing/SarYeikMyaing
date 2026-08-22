using Bookshop.Data;
using Bookshop.Entities;
using Bookshop.Interfaces.Repositories;
using Bookshop.Services.Repositories.Base;

namespace Bookshop.Services.Repositories;

public class PaymentRepo(BookshopDbContext context) : RepositoryBase<Payment>(context), IPaymentRepo
{
    private readonly BookshopDbContext _context = context;
}
