import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrderModel } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MmkCurrencyPipe],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class Orders implements OnInit {
  private readonly orderService = inject(OrderService);

  orders: OrderModel[] = [];
  searchOrderNo = '';
  isLoading = false;

  ngOnInit(): void {
    this.isLoading = true;
    this.orderService.get().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.orders = res.data as OrderModel[];
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  get filteredOrders(): () => OrderModel[] {
    return () => {
      if (!this.searchOrderNo.trim()) return this.orders;
      const q = this.searchOrderNo.toLowerCase().trim();
      return this.orders.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.customerName.toLowerCase().includes(q)
      );
    };
  }
}
