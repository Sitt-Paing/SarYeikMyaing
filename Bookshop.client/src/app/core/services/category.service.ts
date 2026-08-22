import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoryModel } from '../models/category.model';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);

  get(): Observable<RootModel> {
    const url = `${environment.main_url}/Category`;
    return this.http.get<RootModel>(url);
  }

  getById(id: number | string): Observable<RootModel> {
    const url = `${environment.main_url}/Category/${id}`;
    return this.http.get<RootModel>(url);
  }

  create(model: Partial<CategoryModel>): Observable<RootModel> {
    const url = `${environment.main_url}/Category`;
    return this.http.post<RootModel>(url, model);
  }

  update(id: number | string, model: Partial<CategoryModel>): Observable<RootModel> {
    const url = `${environment.main_url}/Category/${id}`;
    return this.http.put<RootModel>(url, model);
  }

  delete(id: number | string): Observable<RootModel> {
    const url = `${environment.main_url}/Category/${id}`;
    return this.http.delete<RootModel>(url);
  }

  save(model: Partial<CategoryModel>): Observable<RootModel> {
    const id = model.id;
    const isEdit = id && Number(id) > 0;
    return isEdit ? this.update(id, model) : this.create(model);
  }
}
