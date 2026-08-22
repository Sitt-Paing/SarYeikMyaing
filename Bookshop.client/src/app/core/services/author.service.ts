import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { Author } from '../models/author.model';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class AuthorService {
  private readonly api = inject(ApiService);
  private readonly notification = inject(NotificationService);

  readonly authors = signal<Author[]>([]);
  readonly isLoading = signal<boolean>(false);

  loadAuthors(): Observable<Author[]> {
    this.isLoading.set(true);
    return this.api.get<Author[]>('Author').pipe(
      map((res) => {
        this.isLoading.set(false);
        if (res?.success && res.data) {
          this.authors.set(res.data);
          return res.data;
        }
        this.authors.set([]);
        return [];
      }),
      tap({
        error: (err) => {
          this.isLoading.set(false);
          this.authors.set([]);
          console.error('Failed to load authors:', err);
        }
      })
    );
  }

  getAuthorById(id: number): Author | undefined {
    return this.authors().find((a) => a.id === id);
  }

  createAuthor(author: Partial<Author>): Observable<ApiResponse<Author>> {
    return this.api.post<Author>('Author', author).pipe(
      tap({
        next: (res) => {
          if (res.success) {
            this.notification.success('Success', 'Author created successfully');
            this.loadAuthors().subscribe();
          } else {
            this.notification.error('Error', res.message || 'Failed to create author');
          }
        },
        error: (err) => {
          this.notification.error('Error', err.error?.message || 'Failed to create author');
        }
      })
    );
  }
}
