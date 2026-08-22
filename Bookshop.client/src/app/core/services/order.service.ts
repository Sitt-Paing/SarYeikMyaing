import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { CreateOrderDto, Order } from '../models/order.model';
import { ApiService } from './api.service';
import { CartService } from './cart.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly api = inject(ApiService);
  private readonly cartService = inject(CartService);
  private readonly notification = inject(NotificationService);

  readonly orders = signal<Order[]>([]);
  readonly isLoading = signal<boolean>(false);

  createOrder(dto: CreateOrderDto): Observable<Order | null> {
    this.isLoading.set(true);
    return this.api.post<Order>('Order', dto).pipe(
      map((res) => {
        this.isLoading.set(false);
        if (res?.success && res.data) {
          this.orders.update((list) => [res.data, ...list]);
          this.cartService.clearCart();
          this.notification.success('Order Placed!', `Your order #${res.data.orderNumber || res.data.id} is confirmed.`);
          return res.data;
        }
        this.notification.error('Order Failed', res?.message || 'Could not place order');
        return null;
      }),
      tap({
        error: (err) => {
          this.isLoading.set(false);
          this.notification.error('Order Failed', err.error?.message || 'Error communicating with server');
        }
      })
    );
  }

  getOrders(): Observable<Order[]> {
    this.isLoading.set(true);
    return this.api.get<Order[]>('Order').pipe(
      map((res) => {
        this.isLoading.set(false);
        if (res?.success && res.data) {
          this.orders.set(res.data);
          return res.data;
        }
        this.orders.set([]);
        return [];
      }),
      tap({
        error: (err) => {
          this.isLoading.set(false);
          this.orders.set([]);
          console.error('Failed to load orders:', err);
        }
      })
    );
  }

  getOrderById(id: number): Observable<Order | null> {
    return this.api.get<Order>(`Order/${id}`).pipe(
      map((res) => (res.success && res.data ? res.data : null))
    );
  }

  updateOrderStatus(orderId: number, status: string): Observable<ApiResponse<any>> {
    return this.api.put<any>(`Order/${orderId}/status`, { status }).pipe(
      tap({
        next: (res) => {
          if (res.success) {
            this.notification.success('Status Updated', `Order status changed to ${status}`);
            this.getOrders().subscribe();
          }
        },
        error: (err) => {
          this.notification.error('Error', err.error?.message || 'Failed to update order status');
        }
      })
    );
  }
}
