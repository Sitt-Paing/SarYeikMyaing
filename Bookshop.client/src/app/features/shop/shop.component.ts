import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Book } from '../../core/models/book.model';
import { BookService } from '../../core/services/book.service';
import { CategoryService } from '../../core/services/category.service';
import { BookCardComponent } from '../../shared/components/book-card/book-card.component';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, BookCardComponent],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
})
export class ShopComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly bookService = inject(BookService);
  readonly categoryService = inject(CategoryService);

  selectedCategoryId: number | null = null;
  searchQuery = '';
  sortOption = 'id_desc';

  ngOnInit(): void {
    this.categoryService.loadCategories().subscribe();

    this.route.queryParams.subscribe((params) => {
      if (params['categoryId']) {
        this.selectedCategoryId = Number(params['categoryId']);
      }
      if (params['q']) {
        this.searchQuery = params['q'];
      }
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

    this.bookService
      .getBooks({
        q: this.searchQuery,
        categoryId: this.selectedCategoryId || undefined,
        sortField,
        order,
      })
      .subscribe();
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
