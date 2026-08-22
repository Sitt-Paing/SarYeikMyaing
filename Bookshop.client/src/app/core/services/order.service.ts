import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateOrderModel, OrderModel } from '../models/order.model';
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

  getById(id: number | string): Observable<RootModel> {
    const url = `${environment.main_url}/Order/${id}`;
    return this.http.get<RootModel>(url);
  }

  create(model: CreateOrderModel): Observable<RootModel> {
    const url = `${environment.main_url}/Order`;
    return this.http.post<RootModel>(url, model);
  }

  updateStatus(id: number | string, status: string): Observable<RootModel> {
    const url = `${environment.main_url}/Order/${id}/status`;
    return this.http.put<RootModel>(url, { status });
  }
}
