import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookService } from '../../../core/services/book.service';
import { CategoryService } from '../../../core/services/category.service';
import { OrderService } from '../../../core/services/order.service';
import { MmkCurrencyPipe } from '../../../shared/pipes/mmk-currency.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MmkCurrencyPipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  readonly bookService = inject(BookService);
  readonly categoryService = inject(CategoryService);
  readonly orderService = inject(OrderService);

  ngOnInit(): void {
    this.bookService.getBooks().subscribe();
    this.categoryService.loadCategories().subscribe();
    this.orderService.getOrders().subscribe();
  }

  get totalRevenue(): number {
    return this.orderService.orders().reduce((sum, o) => sum + o.grandTotal, 0);
  }
}
