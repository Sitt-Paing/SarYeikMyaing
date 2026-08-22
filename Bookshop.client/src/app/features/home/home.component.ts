import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookService } from '../../core/services/book.service';
import { CategoryService } from '../../core/services/category.service';
import { BookCardComponent } from '../../shared/components/book-card/book-card.component';
import { LogoComponent } from '../../shared/components/logo/logo.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, BookCardComponent, LogoComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  readonly bookService = inject(BookService);
  readonly categoryService = inject(CategoryService);

  ngOnInit(): void {
    this.bookService.getBooks().subscribe();
    this.categoryService.loadCategories().subscribe();
  }
}
