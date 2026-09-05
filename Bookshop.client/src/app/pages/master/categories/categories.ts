import { CommonModule, DatePipe } from '@angular/common';
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
import { SplitButtonModule } from 'primeng/splitbutton';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CategoryModel } from '../../../core/models/category.model';
import { CategoryService } from '../../../core/services/category.service';
import { ExportService } from '../../../core/services/export.service';
import { LoggerService } from '../../../core/services/logger.service';
import { SharedService } from '../../../core/services/shared.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-categories',
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
    ButtonModule,
    TableModule,
    ToastModule,
    InputIconModule,
    TranslatePipe,
  ],
  providers: [DatePipe, ConfirmationService, ExportService, MessageService],
  templateUrl: './categories.html',
})
export class Categories implements OnInit {
  @ViewChild(Table) tblCategory!: Table;

  categories: CategoryModel[] = [];
  selectedCategory!: CategoryModel;
  errorMessage = signal<any[]>([]);

  items!: MenuItem[];
  modalVisible = false;
  isEdit = false;
  isLoading = false;
  isSubmitting = false;

  private formBuilder = inject(FormBuilder);
  public categoryForm = this.formBuilder.group({
    id: [0],
    name: ['', Validators.required],
    description: [''],
    icon: ['pi-bookmark'],
  });

  constructor(
    private shareService: SharedService,
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
      {
        label: 'Seed Standard',
        icon: 'pi pi-download',
        command: () => this.seedStandardCategories(),
      },
    ];
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.categoryService.get().subscribe({
      next: (res) => {
        this.categories = (res.data || []) as CategoryModel[];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loggerService.error('Category API error', err);
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load categories',
        });
      },
    });
  }

  create(): void {
    this.isEdit = false;
    this.categoryForm.reset({
      id: 0,
      name: '',
      description: '',
      icon: 'pi-bookmark',
    });
    this.modalVisible = true;
  }

  update(): void {
    if (!this.selectedCategory) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Select Row',
        detail: 'Please select a category row to update.',
      });
      return;
    }
    this.isEdit = true;
    this.categoryForm.patchValue({
      id: this.selectedCategory.id,
      name: this.selectedCategory.name,
      description: this.selectedCategory.description || '',
      icon: this.selectedCategory.icon || 'pi-bookmark',
    });
    this.modalVisible = true;
  }

  save(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const model = this.categoryForm.value as Partial<CategoryModel>;

    const req$ = this.isEdit && model.id
      ? this.categoryService.update(model.id, model)
      : this.categoryService.create(model);

    req$.subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: res.message || (this.isEdit ? 'Category updated' : 'Category created'),
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
    if (!this.selectedCategory) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Select Row',
        detail: 'Please select a category row to delete.',
      });
      return;
    }

    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${this.selectedCategory.name}"?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.categoryService.delete(this.selectedCategory.id).subscribe({
          next: (res) => {
            if (res.success) {
              this.messageService.add({
                severity: 'success',
                summary: 'Deleted',
                detail: 'Category deleted successfully',
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
    this.exportService.excel('Categories_Catalog', this.tblCategory?.el);
  }

  seedStandardCategories(): void {
    const standardCategories: Array<{ name: string; description: string; icon: string }> = [
      { name: 'မြန်မာဝတ္ထုနှင့် ရသစာပေ (Myanmar Novels)', description: 'မြန်မာစာပေ ဝတ္ထုရှည်နှင့် ဝတ္ထုတိုများ', icon: 'pi-book' },
      { name: 'ဘာသာပြန် ဝတ္ထုများ (Translations)', description: 'နိုင်ငံတကာ ကမ္ဘာကျော် ဘာသာပြန်စာပေများ', icon: 'pi-globe' },
      { name: 'အောင်မြင်ရေးနှင့် စိတ်ခွန်အား (Self-Help)', description: 'စိတ်ခွန်အားဖြည့်နှင့် ဘဝလမ်းညွှန် စာအုပ်များ', icon: 'pi-compass' },
      { name: 'စီးပွားရေးနှင့် စီမံခန့်ခွဲမှု (Business)', description: 'စီးပွားရေး၊ ရင်းနှီးမြှုပ်နှံမှုနှင့် ခေါင်းဆောင်မှု', icon: 'pi-chart-line' },
      { name: 'ကလေးစာပေနှင့် ရုပ်ပြ (Children & Comics)', description: 'ကလေးပုံပြင်၊ ပညာပေးနှင့် ရုပ်ပြကာတွန်းများ', icon: 'pi-star' },
      { name: 'ကျန်းမာရေးနှင့် စိတ်ပညာ (Health & Psychology)', description: 'ကိုယ်စိတ်ကျန်းမာရေးနှင့် စိတ်ပညာစာအုပ်များ', icon: 'pi-heart' },
    ];

    for (const cat of standardCategories) {
      this.categoryService.create(cat).subscribe(() => this.loadData());
    }
  }
}
