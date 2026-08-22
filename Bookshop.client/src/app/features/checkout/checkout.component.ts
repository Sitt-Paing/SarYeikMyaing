import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CreateOrderDto, Order, PaymentMethod } from '../../core/models/order.model';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { OrderService } from '../../core/services/order.service';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MmkCurrencyPipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent {
  readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  completedOrder = signal<Order | null>(null);
  isSubmitting = false;

  formData = {
    customerName: this.authService.currentUser()?.userName || '',
    customerPhone: this.authService.currentUser()?.phoneNumber || '',
    customerEmail: this.authService.currentUser()?.email || '',
    shippingAddress: '',
    city: 'Yangon',
    stateDivision: 'Yangon Region',
    orderNotes: '',
    paymentMethod: 'KBZPay' as PaymentMethod,
  };

  onSubmitOrder(event: Event): void {
    event.preventDefault();

    if (!this.formData.customerName.trim() || !this.formData.customerPhone.trim() || !this.formData.shippingAddress.trim()) {
      this.notification.warn('Required Fields', 'Please fill in Name, Phone, and Address.');
      return;
    }

    this.isSubmitting = true;

    const orderDto: CreateOrderDto = {
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
      }))
    };

    this.orderService.createOrder(orderDto).subscribe({
      next: (order) => {
        this.isSubmitting = false;
        if (order) {
          this.completedOrder.set(order);
        }
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }
}
