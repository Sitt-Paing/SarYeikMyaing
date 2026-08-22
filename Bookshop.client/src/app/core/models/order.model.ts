import { Book } from './book.model';

export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
export type PaymentMethod = 'KBZPay' | 'WavePay' | 'AYAPay' | 'CashOnDelivery' | 'CreditCard';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface OrderItem {
  id?: number;
  orderId?: number;
  bookId: number;
  book?: Book;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  orderNumber?: string;
  userId?: number | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  city: string;
  stateDivision?: string;
  postalCode?: string;
  orderNotes?: string;
  totalAmount: number;
  shippingFee: number;
  grandTotal: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  createdOn: string;
  updatedOn?: string | null;
}

export interface CreateOrderDto {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  city: string;
  stateDivision?: string;
  postalCode?: string;
  orderNotes?: string;
  paymentMethod: PaymentMethod;
  items: {
    bookId: number;
    quantity: number;
    unitPrice: number;
  }[];
}
