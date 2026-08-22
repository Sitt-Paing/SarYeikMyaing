import { Book } from './book.model';

export interface Cart {
  id: number;
  userId?: number | null;
  createdOn: string;
  updatedOn?: string | null;
}

export interface CartItem {
  id: number;
  cartId: number;
  bookId: number;
  quantity: number;
  price: number;
  book?: Book;
  createdOn?: string;
  deletedOn?: string | null;
}

export interface CartStateItem {
  book: Book;
  quantity: number;
}
