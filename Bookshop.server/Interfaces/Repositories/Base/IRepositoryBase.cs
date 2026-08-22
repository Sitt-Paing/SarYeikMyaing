using System.Linq.Expressions;

namespace Bookshop.Interfaces.Repositories.Base;

public interface IRepositoryBase<T>
{
    IReadOnlyList<T> Get();
    Task<IReadOnlyList<T>?> GetAsync();
    Task<IReadOnlyList<T>?> GetAsync(Expression<Func<T, bool>> predicate);
    Task<IReadOnlyList<T>?> GetAsync(
        Expression<Func<T, bool>>? predicate = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        string? includeString = null,
        bool disabledTracking = true);
    Task<IReadOnlyList<T>?> GetAsync(
        Expression<Func<T, bool>>? predicate = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        List<Expression<Func<T, object>>>? includes = null,
        bool disabledTracking = true);
    Task<T?> GetByIdAsync(object key);
    Task<T?> GetByIdAsync(params object[] keys);
    Task<T?> GetFirstAsync(Expression<Func<T, bool>> predicate);
    void Create(T entity);
    void CreateRange(List<T> entities);
    void Update(T entity);
    void Delete(T entity);
    Task<bool> AnyAsync(Expression<Func<T, bool>> conditionExpression);
    Task<int> CountAsync();
    Task<int> CountAsync(Expression<Func<T, bool>> conditionExpression);
}