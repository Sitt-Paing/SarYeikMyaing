import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly http = inject(HttpClient);

  getById(id: number | string): Observable<RootModel> {
    const url = `${environment.main_url}/Cart/${id}`;
    return this.http.get<RootModel>(url);
  }

  getUserCart(): Observable<RootModel> {
    const url = `${environment.main_url}/Cart/user`;
    return this.http.get<RootModel>(url);
  }

  create(model?: any): Observable<RootModel> {
    const url = `${environment.main_url}/Cart`;
    return this.http.post<RootModel>(url, model ?? {});
  }

  addItem(model: { cartId?: number; bookId: number; quantity: number }): Observable<RootModel> {
    const url = `${environment.main_url}/Cart/items`;
    return this.http.post<RootModel>(url, model);
  }

  updateItem(itemId: number, quantity: number): Observable<RootModel> {
    const url = `${environment.main_url}/Cart/items/${itemId}`;
    return this.http.put<RootModel>(url, { quantity });
  }

  removeItem(itemId: number): Observable<RootModel> {
    const url = `${environment.main_url}/Cart/items/${itemId}`;
    return this.http.delete<RootModel>(url);
  }

  clear(cartId: number): Observable<RootModel> {
    const url = `${environment.main_url}/Cart/${cartId}/clear`;
    return this.http.delete<RootModel>(url);
  }
}
