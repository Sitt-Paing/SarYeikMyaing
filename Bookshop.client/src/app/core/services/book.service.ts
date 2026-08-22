import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiResponse, PaginatedResult } from '../models/api-response.model';
import { Book, BookFilterParams } from '../models/book.model';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private readonly api = inject(ApiService);
  private readonly notification = inject(NotificationService);

  readonly books = signal<Book[]>([]);
  readonly totalRecords = signal<number>(0);
  readonly isLoading = signal<boolean>(false);

  getBooks(params?: BookFilterParams): Observable<{ books: Book[]; total: number }> {
    this.isLoading.set(true);
    const queryParams: Record<string, any> = {
      skipRows: params?.skipRows ?? 0,
      pageSize: params?.pageSize ?? 20,
      q: params?.q || undefined,
      sortField: params?.sortField || undefined,
      order: params?.order ?? -1,
    };

    return this.api.get<PaginatedResult<Book>>('Book', queryParams).pipe(
      map((res) => {
        this.isLoading.set(false);
        if (res?.success && res.data) {
          const records = res.data.records || [];
          const total = res.data.recordsTotal ?? records.length;
          this.books.set(records);
          this.totalRecords.set(total);
          return { books: records, total };
        }
        this.books.set([]);
        this.totalRecords.set(0);
        return { books: [], total: 0 };
      }),
      tap({
        error: (err) => {
          this.isLoading.set(false);
          this.books.set([]);
          this.totalRecords.set(0);
          console.error('Failed to load books from API:', err);
        }
      })
    );
  }

  getBookById(id: number): Observable<Book | null> {
    this.isLoading.set(true);
    return this.api.get<Book | Book[]>(`Book/${id}`).pipe(
      map((res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          const book = Array.isArray(res.data) ? res.data[0] : res.data;
          return book || null;
        }
        return null;
      }),
      tap({
        error: (err) => {
          this.isLoading.set(false);
          console.error(`Failed to get book #${id}:`, err);
        }
      })
    );
  }

  createBook(book: Partial<Book>): Observable<ApiResponse<Book>> {
    return this.api.post<Book>('Book', book).pipe(
      tap({
        next: (res) => {
          if (res.success) {
            this.notification.success('Success', 'Book created successfully');
            this.getBooks().subscribe();
          } else {
            this.notification.error('Error', res.message || 'Failed to create book');
          }
        },
        error: (err) => {
          this.notification.error('Error', err.error?.message || 'Failed to create book');
        }
      })
    );
  }

  updateBook(id: number, book: Partial<Book>): Observable<ApiResponse<Book>> {
    return this.api.put<Book>(`Book/${id}`, book).pipe(
      tap({
        next: (res) => {
          if (res.success) {
            this.notification.success('Success', 'Book updated successfully');
            this.getBooks().subscribe();
          } else {
            this.notification.error('Error', res.message || 'Failed to update book');
          }
        },
        error: (err) => {
          this.notification.error('Error', err.error?.message || 'Failed to update book');
        }
      })
    );
  }

  deleteBook(id: number): Observable<ApiResponse<any>> {
    return this.api.delete<any>(`Book/${id}`).pipe(
      tap({
        next: (res) => {
          if (res.success) {
            this.notification.success('Deleted', 'Book removed successfully');
            this.getBooks().subscribe();
          } else {
            this.notification.error('Error', res.message || 'Failed to delete book');
          }
        },
        error: (err) => {
          this.notification.error('Error', err.error?.message || 'Failed to delete book');
        }
      })
    );
  }
}
