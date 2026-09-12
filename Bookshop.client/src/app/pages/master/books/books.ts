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
import { DatePickerModule } from 'primeng/datepicker';
import { BookModel } from '../../../core/models/book.model';
import { CategoryModel } from '../../../core/models/category.model';
import { BookService } from '../../../core/services/book.service';
import { CategoryService } from '../../../core/services/category.service';
import { ExportService } from '../../../core/services/export.service';
import { LoggerService } from '../../../core/services/logger.service';
import { SharedService } from '../../../core/services/shared.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
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
    DatePickerModule,
    MmkCurrencyPipe,
    TranslatePipe,
  ],
  providers: [DatePipe, CurrencyPipe, ConfirmationService, ExportService, MessageService],
  templateUrl: './books.html',
})
export class Books implements OnInit {
  @ViewChild(Table) tblBooks!: Table;

  books: BookModel[] = [];
  filteredBooks: BookModel[] = [];
  categories: CategoryModel[] = [];
  selectedBook!: BookModel;
  errorMessage = signal<any[]>([]);

  items!: MenuItem[];
  modalVisible = false;
  isEdit = false;
  isLoading = false;
  isSubmitting = false;

  selectedCategoryId: number | null = null;
  createdDateRange: Date[] | null = null;
  totalRecords = 0;
  imagePreview: string | null = null;

  private formBuilder = inject(FormBuilder);
  public bookForm = this.formBuilder.group({
    id: [0],
    title: ['', Validators.required],
    author: ['', Validators.required],
    categoryId: [1, Validators.required],
    isbn: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    originalPrice: [0],
    stockQuantity: [1, [Validators.required, Validators.min(0)]],
    imageUrl: [''],
    publisher: [''],
    pageCount: [null as number | null],
    language: ['Burmese'],
    description: [''],
  });

  constructor(
    private shareService: SharedService,
    private bookService: BookService,
    private categoryService: CategoryService,
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
  }

  loadData(): void {
    this.isLoading = true;

    let fromDate: Date | null = null;
    let toDate: Date | null = null;
    if (this.createdDateRange && this.createdDateRange.length > 0 && this.createdDateRange[0]) {
      fromDate = this.createdDateRange[0];
      toDate = this.createdDateRange[1] || this.createdDateRange[0];
    }

    this.bookService
      .get({
        skipRows: 0,
        pageSize: 500,
        categoryId: this.selectedCategoryId && this.selectedCategoryId > 0 ? this.selectedCategoryId : undefined,
        fromDate,
        toDate,
      })
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.books = (res.data.records || res.data || []) as BookModel[];
            this.totalRecords = res.data.recordsTotal ?? this.books.length;
            this.onCategoryFilterChange();
            this.cdr.detectChanges();
          } else {
            this.books = [];
            this.filteredBooks = [];
            this.totalRecords = 0;
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

  onDateFilterChange(): void {
    const range = this.createdDateRange;
    if (!range || range.length === 0 || (range[0] && range[1])) {
      this.loadData();
    }
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
      author: '',
      categoryId: this.categories.length > 0 ? this.categories[0].id : 1,
      isbn: '',
      price: 0,
      originalPrice: 0,
      stockQuantity: 1,
      imageUrl: '',
      publisher: '',
      pageCount: null,
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
      author: this.selectedBook.author || this.selectedBook.authorName || '',
      categoryId: this.selectedBook.categoryId,
      isbn: this.selectedBook.isbn,
      price: this.selectedBook.price,
      originalPrice: this.selectedBook.originalPrice,
      stockQuantity: this.selectedBook.stockQuantity,
      imageUrl: this.selectedBook.imageUrl || '',
      publisher: this.selectedBook.publisher || '',
      pageCount: this.selectedBook.pageCount ?? null,
      language: this.selectedBook.language || 'Burmese',
      description: this.selectedBook.description || '',
    });
    this.modalVisible = true;
  }

  isUploadingImage = false;

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Quick local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);

      // Upload to backend server
      this.isUploadingImage = true;
      this.bookService.uploadImage(file).subscribe({
        next: (res) => {
          this.isUploadingImage = false;
          if (res.success && res.data?.url) {
            this.bookForm.patchValue({ imageUrl: res.data.url });
            this.imagePreview = res.data.url;
            this.messageService.add({
              severity: 'info',
              summary: 'Image Uploaded',
              detail: 'Cover image uploaded successfully',
            });
          }
        },
        error: () => {
          this.isUploadingImage = false;
          // Fallback to base64 preview if server endpoint isn't reached
          if (this.imagePreview) {
            this.bookForm.patchValue({ imageUrl: this.imagePreview });
          }
        },
      });
    }
  }

  onImageUrlChange(url: string): void {
    const trimmed = (url || '').trim();
    this.imagePreview = trimmed ? trimmed : null;
  }

  removeImage(): void {
    this.imagePreview = null;
    this.bookForm.patchValue({ imageUrl: '' });
  }

  save(): void {
    if (this.bookForm.invalid) {
      this.bookForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formVal = this.bookForm.value;
    const model = {
      ...formVal,
      pageCount: formVal.pageCount != null && formVal.pageCount !== ('' as any) ? Number(formVal.pageCount) : null,
    } as Partial<BookModel>;

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
