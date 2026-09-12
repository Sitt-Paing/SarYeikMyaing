import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateOrderModel, OrderFilterParams } from '../models/order.model';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);

  get(params?: OrderFilterParams): Observable<RootModel> {
    let url = `${environment.main_url}/Order`;
    if (params) {
      const queryParts: string[] = [];
      if (params.skipRows !== undefined) queryParts.push(`skipRows=${params.skipRows}`);
      if (params.pageSize !== undefined) queryParts.push(`pageSize=${params.pageSize}`);
      if (params.q) queryParts.push(`q=${encodeURIComponent(params.q)}`);
      if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
      if (params.fromDate) {
        const fromStr = params.fromDate instanceof Date ? params.fromDate.toISOString() : params.fromDate;
        queryParts.push(`fromDate=${encodeURIComponent(fromStr)}`);
      }
      if (params.toDate) {
        const toStr = params.toDate instanceof Date ? params.toDate.toISOString() : params.toDate;
        queryParts.push(`toDate=${encodeURIComponent(toStr)}`);
      }
      if (params.sortField) queryParts.push(`sortField=${params.sortField}`);
      if (params.order !== undefined) queryParts.push(`order=${params.order}`);
      if (queryParts.length > 0) {
        url += `?${queryParts.join('&')}`;
      }
    }
    return this.http.get<RootModel>(url);
  }

  getByUserId(userId: string, params?: OrderFilterParams): Observable<RootModel> {
    let url = `${environment.main_url}/Order/user/${userId}`;
    if (params) {
      const queryParts: string[] = [];
      if (params.skipRows !== undefined) queryParts.push(`skipRows=${params.skipRows}`);
      if (params.pageSize !== undefined) queryParts.push(`pageSize=${params.pageSize}`);
      if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
      if (params.fromDate) {
        const fromStr = params.fromDate instanceof Date ? params.fromDate.toISOString() : params.fromDate;
        queryParts.push(`fromDate=${encodeURIComponent(fromStr)}`);
      }
      if (params.toDate) {
        const toStr = params.toDate instanceof Date ? params.toDate.toISOString() : params.toDate;
        queryParts.push(`toDate=${encodeURIComponent(toStr)}`);
      }
      if (queryParts.length > 0) {
        url += `?${queryParts.join('&')}`;
      }
    }
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

  updateStatus(id: number | string, status: string): Observable<RootModel> {
    const url = `${environment.main_url}/Order/${id}/status?status=${encodeURIComponent(status)}`;
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
