import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookModel, CURATED_BOOKS } from '../../core/models/book.model';
import { CategoryModel } from '../../core/models/category.model';
import { BookService } from '../../core/services/book.service';
import { CategoryService } from '../../core/services/category.service';
import { CartState } from '../../core/state/cart.state';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MmkCurrencyPipe, TranslatePipe],
  templateUrl: './book-detail.html',
})
export class BookDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookService = inject(BookService);
  private readonly categoryService = inject(CategoryService);
  private readonly cartService = inject(CartState);
  private readonly cdr = inject(ChangeDetectorRef);

  book: BookModel | null = null;
  categories: CategoryModel[] = [];
  quantity = 1;
  isLoading = false;

  ngOnInit(): void {
    this.categoryService.get().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.categories = (Array.isArray(res.data) ? res.data : (res.data.records || [])) as CategoryModel[];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      },
    });

    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (id) {
        this.quantity = 1;
        this.isLoading = true;
        this.cdr.detectChanges();
        this.bookService.getById(id).subscribe({
          next: (res) => {
            if (res && res.data) {
              this.book = (Array.isArray(res.data) ? res.data[0] : res.data) as BookModel;
            } else {
              this.book = CURATED_BOOKS.find((b) => b.id === id) || null;
            }
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.book = CURATED_BOOKS.find((b) => b.id === id) || null;
            this.isLoading = false;
            this.cdr.detectChanges();
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
