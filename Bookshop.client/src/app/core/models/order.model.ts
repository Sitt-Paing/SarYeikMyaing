import { BookModel } from './book.model';

export type PaymentMethod = 'KBZPay' | 'WavePay' | 'AYAPay' | 'CashOnDelivery';
export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderItemModel {
  id?: number;
  orderId?: number;
  bookId: number;
  book?: BookModel;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface OrderModel {
  id: number;
  orderNumber?: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  city: string;
  stateDivision?: string;
  orderNotes?: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  grandTotal: number;
  items: OrderItemModel[];
  createdOn?: string;
}

export interface CreateOrderModel {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  city: string;
  stateDivision?: string;
  orderNotes?: string;
  paymentMethod: PaymentMethod;
  items: {
    bookId: number;
    quantity: number;
    unitPrice: number;
  }[];
}
