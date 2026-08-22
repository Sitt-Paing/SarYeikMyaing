import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Book } from '../../../core/models/book.model';
import { AuthorService } from '../../../core/services/author.service';
import { BookService } from '../../../core/services/book.service';
import { CategoryService } from '../../../core/services/category.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MmkCurrencyPipe } from '../../../shared/pipes/mmk-currency.pipe';

@Component({
  selector: 'app-books-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    TagModule,
    MmkCurrencyPipe,
  ],
  templateUrl: './books-manager.component.html',
  styleUrl: './books-manager.component.scss',
})
export class BooksManagerComponent implements OnInit {
  readonly bookService = inject(BookService);
  readonly categoryService = inject(CategoryService);
  readonly authorService = inject(AuthorService);
  private readonly notification = inject(NotificationService);

  searchKeyword = '';
  isDialogVisible = false;
  isEditMode = false;
  isSaving = false;

  currentBook: Partial<Book> = {};

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.bookService.getBooks({ q: this.searchKeyword }).subscribe();
    this.categoryService.loadCategories().subscribe();
    this.authorService.loadAuthors().subscribe();
  }

  onSearchChange(): void {
    this.bookService.getBooks({ q: this.searchKeyword }).subscribe();
  }

  getCategoryName(id?: number | null): string {
    if (!id) return 'General';
    const cat = this.categoryService.getCategoryById(id);
    return cat ? cat.name : 'General';
  }

  openNewBookDialog(): void {
    this.isEditMode = false;
    const categories = this.categoryService.categories();
    const authors = this.authorService.authors();

    this.currentBook = {
      title: '',
      price: 0,
      originalPrice: 0,
      stockQuantity: 1,
      categoryId: categories.length > 0 ? categories[0].id : 1,
      authorId: authors.length > 0 ? authors[0].id : 1,
      language: 'Burmese',
      imageUrl: '',
      isbn: '',
      publisher: '',
      description: '',
    };
    this.isDialogVisible = true;
  }

  editBook(book: Book): void {
    this.isEditMode = true;
    this.currentBook = { ...book };
    this.isDialogVisible = true;
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.currentBook.imageUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveBook(): void {
    if (!this.currentBook.title?.trim() || this.currentBook.price === undefined || this.currentBook.price === null) {
      this.notification.warn('Required Fields', 'Please enter Title and Price.');
      return;
    }

    if (!this.currentBook.categoryId) {
      this.notification.warn('Category Required', 'Please select a category.');
      return;
    }

    this.isSaving = true;

    if (this.isEditMode && this.currentBook.id) {
      this.bookService.updateBook(this.currentBook.id, this.currentBook).subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.success) {
            this.isDialogVisible = false;
          }
        },
        error: () => {
          this.isSaving = false;
        }
      });
    } else {
      this.bookService.createBook(this.currentBook).subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.success) {
            this.isDialogVisible = false;
          }
        },
        error: () => {
          this.isSaving = false;
        }
      });
    }
  }

  deleteBook(book: Book): void {
    if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
      this.bookService.deleteBook(book.id).subscribe();
    }
  }
}
