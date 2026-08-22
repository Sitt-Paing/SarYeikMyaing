import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Book } from '../../core/models/book.model';
import { BookService } from '../../core/services/book.service';
import { CategoryService } from '../../core/services/category.service';
import { CartService } from '../../core/services/cart.service';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MmkCurrencyPipe],
  templateUrl: './book-detail.component.html',
  styleUrl: './book-detail.component.scss',
})
export class BookDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookService = inject(BookService);
  private readonly categoryService = inject(CategoryService);
  private readonly cartService = inject(CartService);

  book = signal<Book | null>(null);
  quantity = 1;

  ngOnInit(): void {
    this.categoryService.loadCategories().subscribe();
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) {
        this.quantity = 1;
        this.bookService.getBookById(id).subscribe((b) => {
          this.book.set(b);
        });
      }
    });
  }

  getCategoryName(id?: number | null): string {
    if (!id) return 'Literature';
    const cat = this.categoryService.getCategoryById(id);
    return cat ? cat.name : 'Literature';
  }

  incrementQuantity(): void {
    if (this.book() && this.quantity < this.book()!.stockQuantity) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (this.book()) {
      this.cartService.addToCart(this.book()!, this.quantity);
    }
  }

  buyNow(): void {
    if (this.book()) {
      this.cartService.addToCart(this.book()!, this.quantity);
      this.router.navigate(['/checkout']);
    }
  }
}
