import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Order } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MmkCurrencyPipe],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  private readonly orderService = inject(OrderService);

  orders = signal<Order[]>([]);
  searchOrderNo = '';

  ngOnInit(): void {
    this.orderService.getOrders().subscribe((list) => {
      this.orders.set(list);
    });
  }

  get filteredOrders(): () => Order[] {
    return () => {
      if (!this.searchOrderNo.trim()) return this.orders();
      const q = this.searchOrderNo.toLowerCase().trim();
      return this.orders().filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.customerName.toLowerCase().includes(q)
      );
    };
  }
}
