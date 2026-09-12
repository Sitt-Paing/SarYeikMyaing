import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BookModel } from '../../core/models/book.model';
import { CategoryModel } from '../../core/models/category.model';
import { BookService } from '../../core/services/book.service';
import { CategoryService } from '../../core/services/category.service';
import { CartState } from '../../core/state/cart.state';
import { BookCard } from '../../shared/components/book-card/book-card';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, BookCard, TranslatePipe],
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
  activeTab = signal<'all' | 'bestsellers' | 'new'>('all');
  isLoading = signal<boolean>(true);
  searchQuery = '';

  filteredBooks = computed(() => {
    const catId = this.selectedCategoryId();
    const all = this.books();
    if (!catId) return all;
    return all.filter((b) => b.categoryId === catId);
  });

  bestsellingBooks = computed(() => {
    return this.filteredBooks().slice(0, 8);
  });

  newArrivals = computed(() => {
    return [...this.filteredBooks()].reverse().slice(0, 8);
  });

  displayedCatalogBooks = computed(() => {
    const tab = this.activeTab();
    if (tab === 'bestsellers') return this.bestsellingBooks();
    if (tab === 'new') return this.newArrivals();
    return this.filteredBooks();
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
        this.books.set(dbList);
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.books.set([]);
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
