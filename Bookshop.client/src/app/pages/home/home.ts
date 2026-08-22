import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookModel } from '../../core/models/book.model';
import { CategoryModel } from '../../core/models/category.model';
import { BookService } from '../../core/services/book.service';
import { CategoryService } from '../../core/services/category.service';
import { BookCard } from '../../shared/components/book-card/book-card';
import { Logo } from '../../shared/components/logo/logo';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, BookCard, Logo],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly bookService = inject(BookService);
  private readonly categoryService = inject(CategoryService);

  books: BookModel[] = [];
  categories: CategoryModel[] = [];

  ngOnInit(): void {
    this.bookService.get().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.books = (res.data.records || res.data || []) as BookModel[];
        }
      },
    });

    this.categoryService.get().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.categories = res.data as CategoryModel[];
        }
      },
    });
  }
}
