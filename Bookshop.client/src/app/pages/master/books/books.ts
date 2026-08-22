import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { SplitButtonModule } from 'primeng/splitbutton';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { AuthorModel } from '../../../core/models/author.model';
import { BookModel } from '../../../core/models/book.model';
import { CategoryModel } from '../../../core/models/category.model';
import { AuthorService } from '../../../core/services/author.service';
import { BookService } from '../../../core/services/book.service';
import { CategoryService } from '../../../core/services/category.service';
import { ExportService } from '../../../core/services/export.service';
import { LoggerService } from '../../../core/services/logger.service';
import { SharedService } from '../../../core/services/shared.service';
import { MmkCurrencyPipe } from '../../../shared/pipes/mmk-currency.pipe';

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SplitButtonModule,
    TagModule,
    DialogModule,
    ConfirmDialogModule,
    MessageModule,
    IconFieldModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    TableModule,
    ToastModule,
    InputIconModule,
    MmkCurrencyPipe,
  ],
  providers: [DatePipe, CurrencyPipe, ConfirmationService, ExportService, MessageService],
  templateUrl: './books.html',
  styleUrl: './books.scss',
})
export class Books implements OnInit {
  @ViewChild(Table) tblBooks!: Table;

  books: BookModel[] = [];
  filteredBooks: BookModel[] = [];
  categories: CategoryModel[] = [];
  authors: AuthorModel[] = [];
  selectedBook!: BookModel;
  errorMessage = signal<any[]>([]);

  items!: MenuItem[];
  modalVisible = false;
  isEdit = false;
  isLoading = false;
  isSubmitting = false;

  selectedCategoryId: number | null = null;
  imagePreview: string | null = null;

  private formBuilder = inject(FormBuilder);
  public bookForm = this.formBuilder.group({
    id: [0],
    title: ['', Validators.required],
    authorId: [1, Validators.required],
    categoryId: [1, Validators.required],
    isbn: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    originalPrice: [0],
    stockQuantity: [1, [Validators.required, Validators.min(0)]],
    imageUrl: [''],
    publisher: [''],
    language: ['Burmese'],
    description: [''],
  });

  constructor(
    private shareService: SharedService,
    private bookService: BookService,
    private categoryService: CategoryService,
    private authorService: AuthorService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private loggerService: LoggerService,
    private exportService: ExportService,
    private cdr: ChangeDetectorRef
  ) {
    this.items = [
      {
        label: 'Update',
        icon: 'pi pi-pencil',
        command: () => this.update(),
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.delete(),
      },
      {
        label: 'Excel',
        icon: 'pi pi-file-excel',
        command: () => this.excel(),
      },
    ];
  }

  ngOnInit(): void {
    this.loadMasterData();
    this.loadData();
  }

  loadMasterData(): void {
    this.categoryService.get().subscribe({
      next: (res) => {
        this.categories = (res.data || []) as CategoryModel[];
        this.cdr.detectChanges();
      },
    });
    this.authorService.get().subscribe({
      next: (res) => {
        this.authors = (res.data || []) as AuthorModel[];
        this.cdr.detectChanges();
      },
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.bookService.get().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.books = (res.data.records || res.data || []) as BookModel[];
          this.onCategoryFilterChange();
        } else {
          this.books = [];
          this.filteredBooks = [];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loggerService.error('Book API error', err);
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to connect to API',
        });
      },
    });
  }

  onCategoryFilterChange(): void {
    if (this.selectedCategoryId == null || this.selectedCategoryId === 0) {
      this.filteredBooks = [...this.books];
    } else {
      this.filteredBooks = this.books.filter(
        (b) => Number(b.categoryId) === Number(this.selectedCategoryId)
      );
    }
    this.cdr.detectChanges();
  }

  create(): void {
    this.isEdit = false;
    this.imagePreview = null;
    this.bookForm.reset({
      id: 0,
      title: '',
      authorId: this.authors.length > 0 ? this.authors[0].id : 1,
      categoryId: this.categories.length > 0 ? this.categories[0].id : 1,
      isbn: '',
      price: 0,
      originalPrice: 0,
      stockQuantity: 1,
      imageUrl: '',
      publisher: '',
      language: 'Burmese',
      description: '',
    });
    this.modalVisible = true;
  }

  update(): void {
    if (!this.selectedBook) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Select Row',
        detail: 'Please select a book row to update.',
      });
      return;
    }
    this.isEdit = true;
    this.imagePreview = this.selectedBook.imageUrl || null;
    this.bookForm.patchValue({
      id: this.selectedBook.id,
      title: this.selectedBook.title,
      authorId: this.selectedBook.authorId,
      categoryId: this.selectedBook.categoryId,
      isbn: this.selectedBook.isbn,
      price: this.selectedBook.price,
      originalPrice: this.selectedBook.originalPrice,
      stockQuantity: this.selectedBook.stockQuantity,
      imageUrl: this.selectedBook.imageUrl || '',
      publisher: this.selectedBook.publisher || '',
      language: this.selectedBook.language || 'Burmese',
      description: this.selectedBook.description || '',
    });
    this.modalVisible = true;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        this.imagePreview = base64;
        this.bookForm.patchValue({ imageUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  }

  save(): void {
    if (this.bookForm.invalid) {
      this.bookForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const model = this.bookForm.value as Partial<BookModel>;

    const req$ = this.isEdit && model.id
      ? this.bookService.update(model.id, model)
      : this.bookService.create(model);

    req$.subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: res.message || (this.isEdit ? 'Book updated' : 'Book created'),
          });
          this.modalVisible = false;
          this.loadData();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: res.message || 'Operation failed',
          });
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Server error',
        });
      },
    });
  }

  delete(): void {
    if (!this.selectedBook) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Select Row',
        detail: 'Please select a book row to delete.',
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${this.selectedBook.title}"?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.bookService.delete(this.selectedBook.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.messageService.add({
                severity: 'success',
                summary: 'Deleted',
                detail: 'Book deleted successfully',
              });
              this.loadData();
            }
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error?.message || 'Delete failed',
            });
          },
        });
      },
    });
  }

  excel(): void {
    this.exportService.excel('Books_Catalog', this.tblBooks?.el);
  }

  getCategoryName(id?: number): string {
    const cat = this.categories.find((c) => c.id === id);
    return cat ? cat.name : 'General';
  }
}
