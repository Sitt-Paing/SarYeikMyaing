import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { OrderModel } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';
import { SharedService } from '../../core/services/shared.service';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

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
    MmkCurrencyPipe,
    TranslatePipe,
  ],
  providers: [MessageService, ConfirmationService, DatePipe],
  templateUrl: './orders.html',
})
export class Orders implements OnInit {
  private readonly orderService = inject(OrderService);
  readonly sharedService = inject(SharedService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly datePipe = inject(DatePipe);
  private readonly cdr = inject(ChangeDetectorRef);

  orders = signal<OrderModel[]>([]);
  searchOrderNo = '';
  selectedFilterStatus = signal<string>('ALL');
  isLoading = signal<boolean>(false);

  // Payslip inspection modal
  slipModalVisible = false;
  selectedSlipOrder: OrderModel | null = null;
  isActionLoading = signal<boolean>(false);

  filteredOrders = computed(() => {
    const list = this.orders();
    const filter = this.selectedFilterStatus();
    const q = this.searchOrderNo.toLowerCase().trim();

    return list.filter((o) => {
      const matchStatus = filter === 'ALL' || o.status?.toUpperCase() === filter;
      const matchQuery =
        !q ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.id && o.id.toLowerCase().includes(q)) ||
        (o.cusName && o.cusName.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.cusPhone && o.cusPhone.includes(q)) ||
        (o.customerPhone && o.customerPhone.includes(q));

      return matchStatus && matchQuery;
    });
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.cdr.detectChanges();

    this.orderService.get().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const list = (res.data.records || res.data || []) as OrderModel[];
          this.orders.set(list);
        }
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
    });
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
}
