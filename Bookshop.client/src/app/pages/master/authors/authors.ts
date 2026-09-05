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
import { SelectModule } from 'primeng/select';
import { SplitButtonModule } from 'primeng/splitbutton';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AuthorModel } from '../../../core/models/author.model';
import { AuthorService } from '../../../core/services/author.service';
import { ExportService } from '../../../core/services/export.service';
import { LoggerService } from '../../../core/services/logger.service';
import { SharedService } from '../../../core/services/shared.service';

import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-authors',
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
    ToggleSwitchModule,
    TranslatePipe,
  ],
  providers: [DatePipe, ConfirmationService, ExportService, MessageService],
  templateUrl: './authors.html',
})
export class Authors implements OnInit {
  @ViewChild(Table) tblAuthor!: Table;

  authors: AuthorModel[] = [];
  selectedAuthor: AuthorModel | null = null;
  errorMessage = signal<any[]>([]);

  items!: MenuItem[];
  modalVisible = false;
  isEdit = false;
  isLoading = false;
  isSubmitting = false;

  private readonly formBuilder = inject(FormBuilder);
  public readonly authorForm = this.formBuilder.group({
    id: [0],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    biography: [''],
    imageUrl: [''],
    isActive: [true],
  });

  constructor(
    private readonly shareService: SharedService,
    private readonly authorService: AuthorService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly loggerService: LoggerService,
    private readonly datePipe: DatePipe,
    private readonly exportService: ExportService,
    private readonly cdr: ChangeDetectorRef
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
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.authorService.get().subscribe({
      next: (res) => {
        this.authors = (res.data || []) as AuthorModel[];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loggerService.error('Author API error', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  create(): void {
    this.isEdit = false;
    this.selectedAuthor = null;
    this.authorForm.reset({
      id: 0,
      name: '',
      biography: '',
      imageUrl: '',
      isActive: true,
    });
    this.errorMessage.set([]);
    this.modalVisible = true;
  }

  update(): void {
    if (!this.selectedAuthor || !this.selectedAuthor.id) {
      this.messageService.add({
        key: 'globalMessage',
        severity: 'warn',
        summary: 'Selection Required',
        detail: 'Please select an author from the table first.',
      });
      return;
    }

    this.isEdit = true;
    this.authorForm.reset();
    this.authorForm.patchValue({
      id: Number(this.selectedAuthor.id),
      name: this.selectedAuthor.name,
      biography: this.selectedAuthor.biography ?? '',
      imageUrl: this.selectedAuthor.imageUrl ?? '',
      isActive: this.selectedAuthor.isActive ?? true,
    });
    this.errorMessage.set([]);
    this.modalVisible = true;
  }

  delete(): void {
    if (!this.selectedAuthor || !this.selectedAuthor.id) {
      this.messageService.add({
        key: 'globalMessage',
        severity: 'warn',
        summary: 'Selection Required',
        detail: 'Please select an author from the table first.',
      });
      return;
    }

    const item = this.selectedAuthor;
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${item.name}"?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.authorService.delete(item.id).subscribe({
          next: (res) => {
            this.messageService.add({
              key: 'globalMessage',
              severity: 'success',
              summary: 'Deleted',
              detail: res.message || 'Author deleted successfully.',
            });
            this.selectedAuthor = null;
            this.loadData();
          },
          error: (err) => {
            this.loggerService.error('Delete error', err);
          },
        });
      },
      reject: () => {
        // Selection preserved
      },
      key: 'positionDialog',
    });
  }

  onSubmit(): void {
    if (this.authorForm.invalid) {
      Object.keys(this.authorForm.controls).forEach((field) => {
        this.authorForm.get(field)?.markAsDirty({ onlySelf: true });
      });
      return;
    }

    this.isSubmitting = true;
    const formVal = this.authorForm.value;
    const model: Partial<AuthorModel> = {
      id: formVal.id ?? 0,
      name: formVal.name ?? '',
      biography: formVal.biography ?? '',
      imageUrl: formVal.imageUrl ?? '',
      isActive: formVal.isActive ?? true,
    };
    const currentUser = this.shareService.getUserName() ?? '';

    if (!this.isEdit) {
      model.createdOn = new Date().toISOString();
      model.createdBy = currentUser;

      this.authorService.create(model).subscribe({
        next: (res) => {
          if (res.success) {
            this.modalVisible = false;
            this.selectedAuthor = null;
            this.loadData();
            this.messageService.add({
              key: 'globalMessage',
              severity: 'success',
              summary: 'Created',
              detail: res.message ? res.message.toString() : 'Author created successfully.',
            });
            this.cdr.detectChanges();
          }
          this.isSubmitting = false;
        },
        error: () => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      model.updatedOn = new Date().toISOString();
      model.updatedBy = currentUser;

      this.authorService.update(model.id!, model).subscribe({
        next: (res) => {
          if (res.success) {
            this.modalVisible = false;
            this.selectedAuthor = null;
            this.loadData();
            this.messageService.add({
              key: 'globalMessage',
              severity: 'success',
              summary: 'Updated',
              detail: res.message ? res.message.toString() : 'Author updated successfully.',
            });
            this.cdr.detectChanges();
          }
          this.isSubmitting = false;
        },
        error: () => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  onDialogHide(): void {
    this.modalVisible = false;
  }

  excel(): void {
    this.exportService.excelAll('Authors', this.tblAuthor);
  }
}
