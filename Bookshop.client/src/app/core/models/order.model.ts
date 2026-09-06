import { BookModel } from './book.model';

export type PaymentMethod = 'KBZPay' | 'WavePay' | 'KBZBank' | 'AYABank' | 'CashOnDelivery' | string;
export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderItemModel {
  id?: number | string;
  orderId?: string;
  bookId: number;
  bookTitle?: string;
  book?: BookModel;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface OrderModel {
  id: string;
  orderNumber?: string;
  userId?: string;
  cusName: string;
  customerName?: string; // alias
  cusPhone: string;
  customerPhone?: string; // alias
  cusEmail?: string;
  customerEmail?: string; // alias
  shippingAddress: string;
  shippingCity: string;
  city?: string; // alias
  shippingTownship?: string;
  paymentMethod?: string;
  paymentSlipUrl?: string;
  paymentNotes?: string;
  status: OrderStatus;
  subTotal: number;
  shippingFee: number;
  discount?: number;
  totalAmount: number;
  grandTotal?: number; // alias
  orderItems?: OrderItemModel[];
  items?: OrderItemModel[]; // alias
  createdOn?: string;
  createdBy?: string;
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
  paymentSlipUrl?: string;
  paymentNotes?: string;
  items: {
    bookId: number;
    bookTitle?: string;
    quantity: number;
    unitPrice: number;
  }[];
}
