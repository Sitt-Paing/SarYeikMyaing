namespace Bookshop.Interfaces.Repositories;

public interface IRepositoryWrapper
{
    IAuthorRepo Authors { get; }
    IBookRepo Books { get; }
    ICartRepo Carts { get; }
    ICartItemRepo CartItems { get; }
    ICategoryRepo Categories { get; }
    IOrderRepo Orders { get; }
    IOrderItemRepo OrderItems { get; }
    IPaymentRepo Payments { get; }
    
    #region General Methods
    void Save();
    Task<bool> SaveAsync();
    #endregion
}