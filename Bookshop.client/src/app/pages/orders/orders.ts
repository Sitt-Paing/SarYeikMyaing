import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import { Table, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { OrderModel } from '../../core/models/order.model';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { ExportService } from '../../core/services/export.service';
import { OrderService } from '../../core/services/order.service';
import { SharedService } from '../../core/services/shared.service';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    TableModule,
    PaginatorModule,
    DatePickerModule,
    MmkCurrencyPipe,
    TranslatePipe,
  ],
  providers: [MessageService, ConfirmationService, DatePipe, ExportService],
  templateUrl: './orders.html',
})
export class Orders implements OnInit {
  @ViewChild('tblOrders') tblOrders?: Table;
  @ViewChild('tblExport') tblExport?: ElementRef<HTMLTableElement>;

  private readonly orderService = inject(OrderService);
  private readonly exportService = inject(ExportService);
  readonly sharedService = inject(SharedService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr = inject(ChangeDetectorRef);

  orders = signal<OrderModel[]>([]);
  searchOrderNo = '';
  selectedFilterStatus = signal<string>('ALL');
  isLoading = signal<boolean>(false);

  // Date Range and Pagination State
  dateRange = signal<Date[] | null>(null);
  activeDatePreset = signal<'today' | 'week' | 'month' | 'all'>('all');
  first = signal<number>(0);
  rows = signal<number>(10);
  totalRecords = signal<number>(0);

  // View mode: Admins default to Table view (IMS style) with option to switch to Cards
  viewMode = signal<'table' | 'cards'>('table');

  // Payslip inspection modal
  slipModalVisible = false;
  selectedSlipOrder: OrderModel | null = null;
  isActionLoading = signal<boolean>(false);

  private searchDebounceTimer: any;

  ngOnInit(): void {
    if (!this.sharedService.isAdmin()) {
      this.viewMode.set('cards');
    }
    this.loadOrders();
  }

  loadOrders(resetPage = false): void {
    if (resetPage) {
      this.first.set(0);
    }
    this.isLoading.set(true);
    this.cdr.detectChanges();

    const dates = this.dateRange();
    let fromDate: Date | null = null;
    let toDate: Date | null = null;
    if (dates && dates.length > 0 && dates[0]) {
      fromDate = dates[0];
      toDate = dates[1] || dates[0];
    }

    const filterParams = {
      skipRows: this.first(),
      pageSize: this.rows(),
      q: this.searchOrderNo.trim(),
      status: this.selectedFilterStatus(),
      fromDate: fromDate,
      toDate: toDate,
    };

    this.orderService.get(filterParams).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const list = (res.data.records || res.data || []) as OrderModel[];
          this.orders.set(list);
          this.totalRecords.set(res.data.recordsTotal ?? list.length);
        } else {
          this.orders.set([]);
          this.totalRecords.set(0);
        }
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.orders.set([]);
        this.totalRecords.set(0);
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  onSearchInput(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.loadOrders(true);
    }, 350);
  }

  onStatusChange(status: string): void {
    this.selectedFilterStatus.set(status);
    this.loadOrders(true);
  }

  onDateChange(): void {
    const range = this.dateRange();
    if (!range || range.length === 0 || (range[0] && range[1])) {
      this.activeDatePreset.set('all');
      this.loadOrders(true);
    }
  }

  setQuickDate(preset: 'today' | 'week' | 'month' | 'all'): void {
    this.activeDatePreset.set(preset);
    const now = new Date();

    if (preset === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      this.dateRange.set([todayStart, todayStart]);
    } else if (preset === 'week') {
      const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      this.dateRange.set([pastWeek, now]);
    } else if (preset === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      this.dateRange.set([startOfMonth, now]);
    } else {
      this.dateRange.set(null);
    }

    this.loadOrders(true);
  }

  onPageChange(event: any): void {
    this.first.set(event.first);
    this.rows.set(event.rows);
    this.loadOrders(false);
  }

  exportExcel(): void {
    if (this.tblOrders?.el) {
      this.exportService.excel('Orders_Report', this.tblOrders.el);
    } else if (this.tblExport?.nativeElement) {
      this.exportService.excel('Orders_Report', this.tblExport.nativeElement);
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Export',
        detail: 'No table data available to export.',
      });
    }
  }

  viewSlip(order: OrderModel): void {
    this.selectedSlipOrder = order;
    this.slipModalVisible = true;
  }

  approveOrder(order: OrderModel): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to approve and confirm Order #${order.orderNumber || order.id}?`,
      header: 'Approve Order',
      icon: 'pi pi-check-circle',
      acceptButtonStyleClass: 'p-button-success p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.isActionLoading.set(true);
        this.orderService.approve(order.id).subscribe({
          next: (res) => {
            this.isActionLoading.set(false);
            if (res.success) {
              this.messageService.add({
                severity: 'success',
                summary: 'Order Confirmed',
                detail: `Order #${order.orderNumber || order.id} has been confirmed.`,
              });
              this.slipModalVisible = false;
              this.loadOrders();
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Action Failed',
                detail: res.message || 'Could not approve order.',
              });
            }
          },
          error: (err) => {
            this.isActionLoading.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Action Failed',
              detail: err.error?.message || 'Server error occurred.',
            });
          },
        });
      },
    });
  }

  rejectOrder(order: OrderModel): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to reject Order #${order.orderNumber || order.id}?`,
      header: 'Reject Order',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.isActionLoading.set(true);
        this.orderService.reject(order.id).subscribe({
          next: (res) => {
            this.isActionLoading.set(false);
            if (res.success) {
              this.messageService.add({
                severity: 'info',
                summary: 'Order Rejected',
                detail: `Order #${order.orderNumber || order.id} has been cancelled.`,
              });
              this.slipModalVisible = false;
              this.loadOrders();
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Action Failed',
                detail: res.message || 'Could not reject order.',
              });
            }
          },
          error: (err) => {
            this.isActionLoading.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Action Failed',
              detail: err.error?.message || 'Server error occurred.',
            });
          },
        });
      },
    });
  }

  updateOrderStatus(order: OrderModel, newStatus: string): void {
    this.confirmationService.confirm({
      message: `Change status of Order #${order.orderNumber || order.id} to "${newStatus}"?`,
      header: 'Update Order Status',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-sm p-button-primary',
      rejectButtonStyleClass: 'p-button-sm p-button-text',
      accept: () => {
        this.isActionLoading.set(true);
        this.orderService.updateStatus(order.id, newStatus).subscribe({
          next: (res) => {
            this.isActionLoading.set(false);
            if (res.success) {
              this.messageService.add({
                severity: 'success',
                summary: 'Status Updated',
                detail: `Order status changed to ${newStatus}.`,
              });
              this.loadOrders();
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Action Failed',
                detail: res.message || 'Could not update status.',
              });
            }
          },
          error: (err) => {
            this.isActionLoading.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Action Failed',
              detail: err.error?.message || 'Server error occurred.',
            });
          },
        });
      },
    });
  }
}
