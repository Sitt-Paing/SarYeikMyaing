import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthorFilterCount, BookModel } from '../../core/models/book.model';
import { CategoryModel } from '../../core/models/category.model';
import { BookService } from '../../core/services/book.service';
import { CategoryService } from '../../core/services/category.service';
import { BookCard } from '../../shared/components/book-card/book-card';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, BookCard, TranslatePipe, MmkCurrencyPipe],
  templateUrl: './shop.html',
})
export class Shop implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookService = inject(BookService);
  private readonly categoryService = inject(CategoryService);
  private readonly cdr = inject(ChangeDetectorRef);

  books: BookModel[] = [];
  categories: CategoryModel[] = [];
  authors: AuthorFilterCount[] = [];
  totalRecords = 0;
  isLoading = false;

  // Filter States
  selectedCategoryId: number | null = null;
  selectedAuthor: string | null = null;
  authorSearchInput = '';
  searchQuery = '';
  sortOption = 'id_desc';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  inStockOnly = false;

  // Mobile Filter Slide-over
  isMobileFilterOpen = false;

  get filteredAuthors(): AuthorFilterCount[] {
    if (!this.authorSearchInput.trim()) return this.authors;
    const q = this.authorSearchInput.toLowerCase().trim();
    return this.authors.filter((a) => a.author.toLowerCase().includes(q));
  }

  get hasActiveFilters(): boolean {
    return (
      this.selectedCategoryId !== null ||
      this.selectedAuthor !== null ||
      this.minPrice !== null ||
      this.maxPrice !== null ||
      this.inStockOnly ||
      !!this.searchQuery
    );
  }

  ngOnInit(): void {
    this.categoryService.get().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.categories = (Array.isArray(res.data) ? res.data : (res.data.records || [])) as CategoryModel[];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      },
    });

    this.bookService.getFilterMetadata().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.authors = (res.data.authors || []) as AuthorFilterCount[];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      },
    });

    this.route.queryParams.subscribe((params) => {
      this.selectedCategoryId = params['categoryId'] ? Number(params['categoryId']) : null;
      this.selectedAuthor = params['author'] || null;
      this.searchQuery = params['q'] || '';
      this.minPrice = params['minPrice'] ? Number(params['minPrice']) : null;
      this.maxPrice = params['maxPrice'] ? Number(params['maxPrice']) : null;
      this.inStockOnly = params['inStockOnly'] === 'true';
      this.sortOption = params['sort'] || 'id_desc';
      this.loadBooks();
    });
  }

  loadBooks(): void {
    let sortField = 'id';
    let order = -1;

    if (this.sortOption === 'price_asc') {
      sortField = 'price';
      order = 1;
    } else if (this.sortOption === 'price_desc') {
      sortField = 'price';
      order = -1;
    } else if (this.sortOption === 'title_asc') {
      sortField = 'title';
      order = 1;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.bookService
      .get({
        q: this.searchQuery || undefined,
        categoryId: this.selectedCategoryId || undefined,
        author: this.selectedAuthor || undefined,
        minPrice: this.minPrice !== null ? this.minPrice : undefined,
        maxPrice: this.maxPrice !== null ? this.maxPrice : undefined,
        inStockOnly: this.inStockOnly || undefined,
        sortField,
        order,
      })
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const records = res.data.records || (Array.isArray(res.data) ? res.data : []);
            this.books = records as BookModel[];
            this.totalRecords = res.data.recordsTotal !== undefined ? res.data.recordsTotal : this.books.length;
          } else {
            this.books = [];
            this.totalRecords = 0;
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.books = [];
          this.totalRecords = 0;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  selectCategory(id: number | null): void {
    this.selectedCategoryId = id;
    this.applyFilters();
  }

  selectAuthor(author: string | null): void {
    this.selectedAuthor = this.selectedAuthor === author ? null : author;
    this.applyFilters();
  }

  setPriceRange(min: number | null, max: number | null): void {
    this.minPrice = min;
    this.maxPrice = max;
    this.applyFilters();
  }

  toggleInStock(): void {
    this.inStockOnly = !this.inStockOnly;
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        categoryId: this.selectedCategoryId || null,
        author: this.selectedAuthor || null,
        minPrice: this.minPrice || null,
        maxPrice: this.maxPrice || null,
        inStockOnly: this.inStockOnly ? 'true' : null,
        q: this.searchQuery || null,
        sort: this.sortOption !== 'id_desc' ? this.sortOption : null,
      },
    });
  }

  resetFilters(): void {
    this.selectedCategoryId = null;
    this.selectedAuthor = null;
    this.searchQuery = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.inStockOnly = false;
    this.sortOption = 'id_desc';
    this.router.navigate(['/books']);
  }

  getSelectedCategoryName(): string {
    const cat = this.categories.find((c) => c.id === this.selectedCategoryId);
    return cat ? cat.name : '';
  }
}
