import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookModel } from '../../core/models/book.model';
import { CategoryModel } from '../../core/models/category.model';
import { BookService } from '../../core/services/book.service';
import { CategoryService } from '../../core/services/category.service';
import { BookCard } from '../../shared/components/book-card/book-card';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, BookCard, TranslatePipe],
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
  totalRecords = 0;
  isLoading = false;

  selectedCategoryId: number | null = null;
  searchQuery = '';
  sortOption = 'id_desc';

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

    this.route.queryParams.subscribe((params) => {
      this.selectedCategoryId = params['categoryId'] ? Number(params['categoryId']) : null;
      this.searchQuery = params['q'] || '';
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

  onSortChange(): void {
    this.loadBooks();
  }

  applyFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        categoryId: this.selectedCategoryId || null,
        q: this.searchQuery || null,
      },
      queryParamsHandling: 'merge',
    });
    this.loadBooks();
  }

  resetFilters(): void {
    this.selectedCategoryId = null;
    this.searchQuery = '';
    this.sortOption = 'id_desc';
    this.router.navigate(['/books']);
    this.loadBooks();
  }
}
