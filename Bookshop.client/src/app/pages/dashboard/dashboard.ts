import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookModel } from '../../core/models/book.model';
import { CategoryModel } from '../../core/models/category.model';
import { OrderModel } from '../../core/models/order.model';
import { BookService } from '../../core/services/book.service';
import { CategoryService } from '../../core/services/category.service';
import { OrderService } from '../../core/services/order.service';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MmkCurrencyPipe, TranslatePipe],
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly bookService = inject(BookService);
  private readonly categoryService = inject(CategoryService);
  private readonly orderService = inject(OrderService);
  private readonly cdr = inject(ChangeDetectorRef);

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
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      },
    });

    this.categoryService.get().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.totalCategories = (res.data as CategoryModel[]).length;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      },
    });

    this.orderService.get().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.orders = (res.data.records || res.data || []) as OrderModel[];
          this.totalRevenue = this.orders.reduce((sum, o) => sum + (o.totalAmount || o.grandTotal || 0), 0);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      },
    });
  }
}
