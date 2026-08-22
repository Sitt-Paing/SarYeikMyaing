import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthorModel } from '../models/author.model';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class AuthorService {
  private readonly http = inject(HttpClient);

  get(): Observable<RootModel> {
    const url = `${environment.main_url}/Author`;
    return this.http.get<RootModel>(url);
  }

  getById(id: number | string): Observable<RootModel> {
    const url = `${environment.main_url}/Author/${id}`;
    return this.http.get<RootModel>(url);
  }

  create(model: Partial<AuthorModel>): Observable<RootModel> {
    const url = `${environment.main_url}/Author`;
    return this.http.post<RootModel>(url, model);
  }

  update(id: number | string, model: Partial<AuthorModel>): Observable<RootModel> {
    const url = `${environment.main_url}/Author/${id}`;
    return this.http.put<RootModel>(url, model);
  }

  delete(id: number | string): Observable<RootModel> {
    const url = `${environment.main_url}/Author/${id}`;
    return this.http.delete<RootModel>(url);
  }
}
