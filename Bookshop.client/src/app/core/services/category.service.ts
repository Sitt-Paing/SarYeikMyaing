import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { Category } from '../models/category.model';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly api = inject(ApiService);
  private readonly notification = inject(NotificationService);

  readonly categories = signal<Category[]>([]);
  readonly isLoading = signal<boolean>(false);

  loadCategories(): Observable<Category[]> {
    this.isLoading.set(true);
    return this.api.get<Category[]>('Category').pipe(
      map((res) => {
        this.isLoading.set(false);
        if (res?.success && res.data) {
          this.categories.set(res.data);
          return res.data;
        }
        this.categories.set([]);
        return [];
      }),
      tap({
        error: (err) => {
          this.isLoading.set(false);
          this.categories.set([]);
          console.error('Failed to load categories:', err);
        }
      })
    );
  }

  getCategoryById(id: number): Category | undefined {
    return this.categories().find((c) => c.id === id);
  }

  createCategory(category: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.api.post<Category>('Category', category).pipe(
      tap({
        next: (res) => {
          if (res.success) {
            this.notification.success('Success', 'Category created successfully');
            this.loadCategories().subscribe();
          } else {
            this.notification.error('Error', res.message || 'Failed to create category');
          }
        },
        error: (err) => {
          this.notification.error('Error', err.error?.message || 'Failed to create category');
        }
      })
    );
  }

  updateCategory(id: number, category: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.api.put<Category>(`Category/${id}`, category).pipe(
      tap({
        next: (res) => {
          if (res.success) {
            this.notification.success('Success', 'Category updated successfully');
            this.loadCategories().subscribe();
          } else {
            this.notification.error('Error', res.message || 'Failed to update category');
          }
        },
        error: (err) => {
          this.notification.error('Error', err.error?.message || 'Failed to update category');
        }
      })
    );
  }

  deleteCategory(id: number): Observable<ApiResponse<any>> {
    return this.api.delete<any>(`Category/${id}`).pipe(
      tap({
        next: (res) => {
          if (res.success) {
            this.notification.success('Deleted', 'Category removed successfully');
            this.loadCategories().subscribe();
          } else {
            this.notification.error('Error', res.message || 'Failed to delete category');
          }
        },
        error: (err) => {
          this.notification.error('Error', err.error?.message || 'Failed to delete category');
        }
      })
    );
  }
}
