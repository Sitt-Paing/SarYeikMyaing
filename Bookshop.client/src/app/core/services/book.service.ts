import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BookFilterParams, BookModel } from '../models/book.model';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private readonly http = inject(HttpClient);

  get(params?: BookFilterParams): Observable<RootModel> {
    let url = `${environment.main_url}/Book`;
    const queryParts: string[] = [];

    const skipRows = params?.skipRows ?? 0;
    const pageSize = params?.pageSize ?? 50;
    queryParts.push(`skipRows=${skipRows}`);
    queryParts.push(`pageSize=${pageSize}`);

    if (params?.q) queryParts.push(`q=${encodeURIComponent(params.q)}`);
    if (params?.categoryId) queryParts.push(`categoryId=${params.categoryId}`);
    if (params?.sortField) queryParts.push(`sortField=${params.sortField}`);
    if (params?.order !== undefined) queryParts.push(`order=${params.order}`);

    if (queryParts.length > 0) {
      url += `?${queryParts.join('&')}`;
    }

    return this.http.get<RootModel>(url);
  }

  uploadImage(file: File): Observable<RootModel> {
    const formData = new FormData();
    formData.append('file', file);
    const url = `${environment.main_url}/Book/upload-image`;
    return this.http.post<RootModel>(url, formData);
  }

  getById(id: string | number): Observable<RootModel> {
    const url = `${environment.main_url}/Book/${id}`;
    return this.http.get<RootModel>(url);
  }

  create(model: Partial<BookModel>): Observable<RootModel> {
    const url = `${environment.main_url}/Book`;
    return this.http.post<RootModel>(url, model);
  }

  update(id: number | string, model: Partial<BookModel>): Observable<RootModel> {
    const url = `${environment.main_url}/Book/${id}`;
    return this.http.put<RootModel>(url, model);
  }

  delete(id: string | number): Observable<RootModel> {
    const url = `${environment.main_url}/Book/${id}`;
    return this.http.delete<RootModel>(url);
  }

  save(model: Partial<BookModel>): Observable<RootModel> {
    const id = model.id;
    const isEdit = id && Number(id) > 0;
    return isEdit ? this.update(id, model) : this.create(model);
  }
}
