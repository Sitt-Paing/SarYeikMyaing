import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookModel } from '../../core/models/book.model';
import { CategoryModel } from '../../core/models/category.model';
import { BookService } from '../../core/services/book.service';
import { CartService } from '../../core/services/cart.service';
import { CategoryService } from '../../core/services/category.service';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MmkCurrencyPipe],
  templateUrl: './book-detail.html',
  styleUrl: './book-detail.scss',
})
export class BookDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookService = inject(BookService);
  private readonly categoryService = inject(CategoryService);
  private readonly cartService = inject(CartService);

  book: BookModel | null = null;
  categories: CategoryModel[] = [];
  quantity = 1;
  isLoading = false;

  ngOnInit(): void {
    this.categoryService.get().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.categories = res.data as CategoryModel[];
        }
      },
    });

    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) {
        this.quantity = 1;
        this.isLoading = true;
        this.bookService.getById(id).subscribe({
          next: (res) => {
            if (res.success && res.data) {
              this.book = (Array.isArray(res.data) ? res.data[0] : res.data) as BookModel;
            }
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          },
        });
      }
    });
  }

  getCategoryName(id?: number): string {
    const cat = this.categories.find((c) => c.id === id);
    return cat ? cat.name : 'Literature';
  }

  incrementQuantity(): void {
    if (this.book && this.quantity < this.book.stockQuantity) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.book) {
      this.cartService.addToCart(this.book, this.quantity);
    }
  }

  buyNow(): void {
    if (this.book) {
      this.cartService.addToCart(this.book, this.quantity);
      this.router.navigate(['/checkout']);
    }
  }
}
