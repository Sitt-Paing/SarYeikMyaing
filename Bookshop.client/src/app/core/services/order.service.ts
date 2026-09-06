import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateOrderModel } from '../models/order.model';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);

  get(): Observable<RootModel> {
    const url = `${environment.main_url}/Order`;
    return this.http.get<RootModel>(url);
  }

  getPending(): Observable<RootModel> {
    const url = `${environment.main_url}/Order/pending`;
    return this.http.get<RootModel>(url);
  }

  getById(id: number | string): Observable<RootModel> {
    const url = `${environment.main_url}/Order/${id}`;
    return this.http.get<RootModel>(url);
  }

  uploadSlip(file: File): Observable<RootModel> {
    const formData = new FormData();
    formData.append('file', file);
    const url = `${environment.main_url}/Order/upload-slip`;
    return this.http.post<RootModel>(url, formData);
  }

  create(model: any): Observable<RootModel> {
    const url = `${environment.main_url}/Order`;
    return this.http.post<RootModel>(url, model);
  }

  approve(id: number | string): Observable<RootModel> {
    const url = `${environment.main_url}/Order/${id}/approve`;
    return this.http.put<RootModel>(url, {});
  }

  reject(id: number | string): Observable<RootModel> {
    const url = `${environment.main_url}/Order/${id}/reject`;
    return this.http.put<RootModel>(url, {});
  }

  update(id: number | string, model: any): Observable<RootModel> {
    const url = `${environment.main_url}/Order/${id}`;
    return this.http.put<RootModel>(url, model);
  }

  delete(id: number | string): Observable<RootModel> {
    const url = `${environment.main_url}/Order/${id}`;
    return this.http.delete<RootModel>(url);
  }
}
