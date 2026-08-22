import { BookModel } from './book.model';

export interface CartItemModel {
  id?: number;
  cartId?: number;
  bookId: number;
  book: BookModel;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface CartModel {
  id?: number;
  userId?: string;
  items: CartItemModel[];
  subtotal: number;
  shippingFee: number;
  grandTotal: number;
}
