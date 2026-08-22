using System.Linq.Expressions;
using Bookshop.Data;
using Bookshop.Interfaces.Repositories.Base;
using Microsoft.EntityFrameworkCore;

namespace Bookshop.Services.Repositories.Base;

public abstract class RepositoryBase<T>(BookshopDbContext context) : IRepositoryBase<T> where T: class
{
    private BookshopDbContext Context { get; set; } = context;
    
    public IReadOnlyList<T> Get() => Context.Set<T>().ToList();

    public async Task<IReadOnlyList<T>?> GetAsync() => await Context.Set<T>().ToListAsync();
    
    public async Task<IReadOnlyList<T>?> GetAsync(Expression<Func<T, bool>> predicate) => await Context.Set<T>().Where(predicate).ToListAsync();

    public async Task<IReadOnlyList<T>?> GetAsync(Expression<Func<T, bool>>? predicate = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        string? includeString = null,
        bool disableTracking = true)
    {
        IQueryable<T> query = Context.Set<T>();
        if (disableTracking)
        {
            query = query.AsNoTracking();
        }

        if (!string.IsNullOrWhiteSpace(includeString))
        {
            query = query.Include(includeString);
        }

        if (predicate != null)
        {
            query = query.Where(predicate);
        }

        return orderBy != null ? await orderBy(query).ToListAsync() : (IReadOnlyList<T>)await query.ToListAsync();
    }
    
    public async Task<IReadOnlyList<T>?> GetAsync(Expression<Func<T, bool>>? predicate = null,
        Func<IQueryable<T>, IOrderedQueryable<T>>? orderBy = null,
        List<Expression<Func<T, object>>>? includes = null,
        bool disabledTracking = true)
    {
        IQueryable<T> query = Context.Set<T>();
        if (disabledTracking)
        {
            query = query.AsNoTracking();
        }

        if (includes != null)
        {
            query = includes.Aggregate(query, (current, include) => current.Include(include));
        }

        if (predicate != null)
        {
            query = query.Where(predicate);
        }

        return orderBy != null ? await orderBy(query).ToListAsync() : (IReadOnlyList<T>)await query.ToListAsync();
    }
    
    public virtual async Task<T?> GetByIdAsync(object key)
        => await Context.Set<T>().FindAsync(key);

    public virtual async Task<T?> GetByIdAsync(params object[] keys)
        => await Context.Set<T>().FindAsync(keys);

    public virtual async Task<T?> GetFirstAsync(Expression<Func<T, bool>> predicate)
        => await Context.Set<T>().FirstOrDefaultAsync(predicate);

    public void Create(T entity)
        => _ = Context.Set<T>().Add(entity);
    
    public void CreateRange(List<T> entities) => Context.Set<T>().AddRange(entities); 
    
    public void Update(T entity) => _ = Context.Entry(entity).State = EntityState.Modified;
    
    public void UpdateRange(List<T> entities)
        => entities.ForEach(x => Context.Entry(x).State = EntityState.Modified);
    
    public void Delete(T entity) => _ = Context.Set<T>().Remove(entity);
    
    public IQueryable<T> FindAll
        => Context.Set<T>().AsNoTracking();

    public IQueryable<T> FindByConditions(Expression<Func<T, bool>> conditionExpression)
        => Context.Set<T>().Where(conditionExpression).AsNoTracking();

    public async Task<bool> AnyAsync(Expression<Func<T, bool>> conditionExpression)
        => await Context.Set<T>().AnyAsync(conditionExpression);

    public async Task<int> CountAsync() => await Context.Set<T>().CountAsync();

    public async Task<int> CountAsync(Expression<Func<T, bool>> conditionExpression)
        => await Context.Set<T>().CountAsync(conditionExpression);
}