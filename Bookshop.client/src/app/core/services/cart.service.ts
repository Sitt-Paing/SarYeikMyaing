import { Injectable, computed, inject, signal } from '@angular/core';
import { Book } from '../models/book.model';
import { CartStateItem } from '../models/cart.model';
import { NotificationService } from './notification.service';

const CART_STORAGE_KEY = 'sar_oat_sin_cart';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly notification = inject(NotificationService);

  readonly items = signal<CartStateItem[]>(this.loadCartFromStorage());

  readonly itemCount = computed(() =>
    this.items().reduce((total, item) => total + item.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this.items().reduce((total, item) => total + item.book.price * item.quantity, 0)
  );

  readonly shippingFee = computed(() => {
    const sub = this.subtotal();
    if (sub === 0) return 0;
    if (sub >= 50000) return 0; // Free delivery over 50,000 MMK
    return 2500; // Standard Yangon / Mandalay flat shipping fee
  });

  readonly grandTotal = computed(() => this.subtotal() + this.shippingFee());

  addToCart(book: Book, quantity: number = 1): void {
    if (book.stockQuantity <= 0) {
      this.notification.warn('Out of Stock', `"${book.title}" is currently sold out.`);
      return;
    }

    this.items.update((current) => {
      const existing = current.find((item) => item.book.id === book.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, book.stockQuantity);
        return current.map((item) =>
          item.book.id === book.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...current, { book, quantity: Math.min(quantity, book.stockQuantity) }];
    });

    this.saveCartToStorage();
    this.notification.success('Added to Cart', `"${book.title}" was added to your shopping cart.`);
  }

  updateQuantity(bookId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(bookId);
      return;
    }

    this.items.update((current) =>
      current.map((item) => {
        if (item.book.id === bookId) {
          const maxStock = item.book.stockQuantity || 999;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      })
    );
    this.saveCartToStorage();
  }

  removeItem(bookId: number): void {
    const bookToRemove = this.items().find((item) => item.book.id === bookId);
    this.items.update((current) => current.filter((item) => item.book.id !== bookId));
    this.saveCartToStorage();
    if (bookToRemove) {
      this.notification.info('Item Removed', `"${bookToRemove.book.title}" was removed from cart.`);
    }
  }

  clearCart(): void {
    this.items.set([]);
    this.saveCartToStorage();
  }

  private saveCartToStorage(): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items()));
    } catch {
      // Ignore storage errors
    }
  }

  private loadCartFromStorage(): CartStateItem[] {
    try {
      const data = localStorage.getItem(CART_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
