import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookModel } from '../../core/models/book.model';
import { CategoryModel } from '../../core/models/category.model';
import { OrderModel } from '../../core/models/order.model';
import { BookService } from '../../core/services/book.service';
import { CategoryService } from '../../core/services/category.service';
import { OrderService } from '../../core/services/order.service';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MmkCurrencyPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly bookService = inject(BookService);
  private readonly categoryService = inject(CategoryService);
  private readonly orderService = inject(OrderService);

  totalBooks = 0;
  totalCategories = 0;
  orders: OrderModel[] = [];
  totalRevenue = 0;

  ngOnInit(): void {
    this.bookService.get().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const records = res.data.records || res.data || [];
          this.totalBooks = res.data.recordsTotal || records.length;
        }
      },
    });

    this.categoryService.get().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.totalCategories = (res.data as CategoryModel[]).length;
        }
      },
    });

    this.orderService.get().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.orders = res.data as OrderModel[];
          this.totalRevenue = this.orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
        }
      },
    });
  }
}
