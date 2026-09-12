import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateReviewRequest } from '../models/review.model';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private readonly http = inject(HttpClient);

  getByBookId(bookId: number): Observable<RootModel> {
    const url = `${environment.main_url}/Review/book/${bookId}`;
    return this.http.get<RootModel>(url);
  }

  create(dto: CreateReviewRequest): Observable<RootModel> {
    const url = `${environment.main_url}/Review`;
    return this.http.post<RootModel>(url, dto);
  }

  delete(id: number): Observable<RootModel> {
    const url = `${environment.main_url}/Review/${id}`;
    return this.http.delete<RootModel>(url);
  }
}
