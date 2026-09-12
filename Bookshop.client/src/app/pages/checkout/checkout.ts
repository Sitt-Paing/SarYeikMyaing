import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { OrderModel, PaymentMethod } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';
import { SharedService } from '../../core/services/shared.service';
import { CartState } from '../../core/state/cart.state';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, ToastModule, MmkCurrencyPipe, TranslatePipe],
  providers: [MessageService, ConfirmationService],
  templateUrl: './checkout.html',
})
export class Checkout {
  readonly cartService = inject(CartState);
  private readonly orderService = inject(OrderService);
  private readonly sharedService = inject(SharedService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  completedOrder: OrderModel | null = null;
  isSubmitting = false;
  isUploadingSlip = false;
  isMobileSummaryOpen = false;
  paymentSlipUrl = '';
  slipPreviewUrl = '';
  slipUploadError = '';

  readonly paymentAccounts: Record<string, { accountName: string; accountNumber: string; type: string; instructions: string; }> = {
    KBZPay: {
      accountName: 'Sar Yeik Myaing',
      accountNumber: '09-798123456',
      type: 'KBZPay Wallet',
      instructions: 'Please transfer the total amount to this KBZPay number and upload the transaction slip screenshot below.',
    },
    KBZBank: {
      accountName: 'Sar Yeik Myaing Bookshop',
      accountNumber: '092-301-999-123456',
      type: 'KBZ Bank Account',
      instructions: 'Please transfer the total amount to this KBZ Bank account and upload the receipt slip below.',
    },
    WavePay: {
      accountName: 'Sar Yeik Myaing',
      accountNumber: '09-798123456',
      type: 'WavePay Wallet',
      instructions: 'Please transfer to this WavePay account and upload the payment slip screenshot below.',
    },
    AYABank: {
      accountName: 'Sar Yeik Myaing Bookshop',
      accountNumber: '400-112-998877',
      type: 'AYA Bank Account',
      instructions: 'Please transfer to this AYA Bank account and upload the receipt slip below.',
    },
    CashOnDelivery: {
      accountName: 'Cash on Delivery',
      accountNumber: '-',
      type: 'Pay upon delivery',
      instructions: 'Pay directly in cash when our courier delivers the books to your address.',
    },
  };

  get currentAccount(): { accountName: string; accountNumber: string; type: string; instructions: string; } {
    return this.paymentAccounts[this.formData.paymentMethod] || this.paymentAccounts['KBZPay'];
  }

  formData = {
    customerName: this.sharedService.userNameSignal() !== 'Guest' ? this.sharedService.userNameSignal() : '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    city: 'Yangon',
    shippingTownship: '',
    orderNotes: '',
    paymentMethod: 'KBZPay' as PaymentMethod,
    paymentNotes: '',
  };

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        this.slipUploadError = 'Please upload a valid image file (PNG, JPG, JPEG).';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.slipUploadError = 'File size should not exceed 5MB.';
        return;
      }

      this.slipUploadError = '';
      this.isUploadingSlip = true;

      // 1. Instant local thumbnail preview
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.slipPreviewUrl = e.target?.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);

      // 2. Upload file to backend server
      this.orderService.uploadSlip(file).subscribe({
        next: (res) => {
          this.isUploadingSlip = false;
          if (res.success && res.data?.url) {
            this.paymentSlipUrl = res.data.url;
          } else {
            // Fallback to preview if backend failed
            this.paymentSlipUrl = this.slipPreviewUrl;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isUploadingSlip = false;
          // Fallback to preview
          this.paymentSlipUrl = this.slipPreviewUrl;
          this.cdr.detectChanges();
        },
      });
    }
  }

  removeSlip(): void {
    this.paymentSlipUrl = '';
    this.slipPreviewUrl = '';
    this.slipUploadError = '';
    this.cdr.detectChanges();
  }

  onSubmitOrder(event: Event): void {
    event.preventDefault();

    if (!this.formData.customerName.trim() || !this.formData.customerPhone.trim() || !this.formData.shippingAddress.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Required Fields',
        detail: 'Please fill in Name, Phone, and Shipping Address.',
      });
      return;
    }

    if (this.formData.paymentMethod !== 'CashOnDelivery' && !this.paymentSlipUrl) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Payment Slip Required',
        detail: 'Please upload the payment slip screenshot before submitting.',
      });
      return;
    }

    this.isSubmitting = true;
    this.cdr.detectChanges();

    const orderPayload = {
      id: '',
      orderNumber: '',
      cusName: this.formData.customerName.trim(),
      cusPhone: this.formData.customerPhone.trim(),
      cusEmail: this.formData.customerEmail.trim(),
      shippingAddress: this.formData.shippingAddress.trim(),
      shippingCity: this.formData.city.trim(),
      shippingTownship: this.formData.shippingTownship.trim() || this.formData.city.trim(),
      subTotal: this.cartService.subtotal(),
      shippingFee: this.cartService.shippingFee(),
      totalAmount: this.cartService.grandTotal(),
      paymentMethod: this.formData.paymentMethod,
      paymentSlipUrl: this.paymentSlipUrl,
      paymentNotes: this.formData.paymentNotes.trim(),
      status: 'Pending',
      orderItems: this.cartService.items().map((item) => ({
        bookId: item.book.id,
        bookTitle: item.book.title,
        quantity: item.quantity,
        unitPrice: item.book.price,
        totalPrice: item.quantity * item.book.price,
      })),
    };

    this.orderService.create(orderPayload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success && res.data) {
          const isCod = this.formData.paymentMethod === 'CashOnDelivery';
          const itemsSnapshot = this.cartService.items().map((item) => ({
            bookId: item.book.id,
            bookTitle: item.book.title,
            quantity: item.quantity,
            unitPrice: item.book.price,
            totalPrice: item.quantity * item.book.price,
          }));

          this.completedOrder = {
            ...(res.data as OrderModel),
            orderItems: itemsSnapshot,
          };
          this.cartService.clearCart();
          this.messageService.add({
            severity: 'success',
            summary: isCod ? 'Order Confirmed!' : 'Order Placed!',
            detail: isCod
              ? 'Your Cash on Delivery order has been confirmed. We will prepare your parcel shortly.'
              : 'Your payment slip is submitted. Admin will verify your transfer screenshot.',
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Order Failed',
            detail: res.message || 'Could not place order.',
          });
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        let detailMsg = err.error?.message || 'Server error occurred.';
        if (err.error?.errors) {
          const validationDetails = Object.values(err.error.errors).flat().join(' ');
          if (validationDetails) detailMsg = validationDetails;
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Order Failed',
          detail: detailMsg,
        });
        this.cdr.detectChanges();
      },
    });
  }
}
