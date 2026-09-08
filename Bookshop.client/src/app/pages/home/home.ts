import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BookModel, CURATED_BOOKS } from '../../core/models/book.model';
import { CategoryModel } from '../../core/models/category.model';
import { BookService } from '../../core/services/book.service';
import { CategoryService } from '../../core/services/category.service';
import { CartState } from '../../core/state/cart.state';
import { BookCard } from '../../shared/components/book-card/book-card';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, BookCard, TranslatePipe, MmkCurrencyPipe],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private readonly bookService = inject(BookService);
  private readonly categoryService = inject(CategoryService);
  readonly cartService = inject(CartState);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  books = signal<BookModel[]>([]);
  categories = signal<CategoryModel[]>([]);
  selectedCategoryId = signal<number | null>(null);
  isLoading = signal<boolean>(true);
  searchQuery = '';

  filteredBooks = computed(() => {
    const catId = this.selectedCategoryId();
    const all = this.books();
    if (!catId) return all;
    return all.filter((b) => b.categoryId === catId);
  });

  featuredBooks = computed(() => {
    return this.filteredBooks().slice(0, 8);
  });

  favouriteReads = computed(() => {
    const all = this.filteredBooks();
    return {
      leftList: all.slice(0, 4),
      centerFeatured: all.slice(4, 6).length === 2 ? all.slice(4, 6) : (all.length > 0 ? [all[0], all[1] || all[0]] : []),
      rightList: all.slice(6, 10),
    };
  });

  trendingBooks = computed(() => {
    return this.filteredBooks().slice(2, 6);
  });

  bestsellingBooks = computed(() => {
    return this.filteredBooks().slice(6, 10);
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.cdr.detectChanges();

    this.bookService.get().subscribe({
      next: (res) => {
        const dbList = (res.success && res.data ? (res.data.records || (Array.isArray(res.data) ? res.data : [])) : []) as BookModel[];
        // Combine DB books with curated books so catalog is rich and user books are highlighted first
        const existingIds = new Set(dbList.map((b) => b.id));
        const combined = [...dbList, ...CURATED_BOOKS.filter((b) => !existingIds.has(b.id))];
        this.books.set(combined);
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.books.set(CURATED_BOOKS);
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
    });

    this.categoryService.get().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.categories.set((Array.isArray(res.data) ? res.data : (res.data.records || [])) as CategoryModel[]);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      },
    });
  }

  selectCategory(id: number | null): void {
    this.selectedCategoryId.set(id);
  }

  onSearch(event: Event): void {
    event.preventDefault();
    if (this.searchQuery.trim()) {
      this.router.navigate(['/books'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }
}
