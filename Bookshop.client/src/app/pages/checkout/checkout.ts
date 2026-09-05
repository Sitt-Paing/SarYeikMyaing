import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CreateOrderModel, OrderModel, PaymentMethod } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';
import { SharedService } from '../../core/services/shared.service';
import { CartState } from '../../core/state/cart.state';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, ToastModule, MmkCurrencyPipe],
  providers: [MessageService, ConfirmationService],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  readonly cartService = inject(CartState);
  private readonly orderService = inject(OrderService);
  private readonly sharedService = inject(SharedService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  completedOrder: OrderModel | null = null;
  isSubmitting = false;

  formData = {
    customerName: this.sharedService.userNameSignal() !== 'Guest' ? this.sharedService.userNameSignal() : '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    city: 'Yangon',
    stateDivision: 'Yangon Region',
    orderNotes: '',
    paymentMethod: 'KBZPay' as PaymentMethod,
  };

  onSubmitOrder(event: Event): void {
    event.preventDefault();

    if (!this.formData.customerName.trim() || !this.formData.customerPhone.trim() || !this.formData.shippingAddress.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Required Fields',
        detail: 'Please fill in Name, Phone, and Address.',
      });
      return;
    }

    this.isSubmitting = true;

    const orderDto: CreateOrderModel = {
      customerName: this.formData.customerName,
      customerPhone: this.formData.customerPhone,
      customerEmail: this.formData.customerEmail,
      shippingAddress: this.formData.shippingAddress,
      city: this.formData.city,
      stateDivision: this.formData.stateDivision,
      orderNotes: this.formData.orderNotes,
      paymentMethod: this.formData.paymentMethod,
      items: this.cartService.items().map((item) => ({
        bookId: item.book.id,
        quantity: item.quantity,
        unitPrice: item.book.price,
      })),
    };

    this.orderService.create(orderDto).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success && res.data) {
          this.completedOrder = res.data as OrderModel;
          this.cartService.clearCart();
          this.messageService.add({
            severity: 'success',
            summary: 'Order Placed!',
            detail: `Your order #${this.completedOrder.orderNumber || this.completedOrder.id} is confirmed.`,
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Order Failed',
            detail: res.message || 'Could not place order.',
          });
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Order Failed',
          detail: err.error?.message || 'Server error',
        });
      },
    });
  }
}
