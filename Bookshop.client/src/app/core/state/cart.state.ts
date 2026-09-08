import { Injectable, computed, signal } from '@angular/core';
import { BookModel } from '../models/book.model';
import { CartItemModel } from '../models/cart.model';

const CART_STORAGE_KEY = 'sar_oat_sin_cart';

@Injectable({
  providedIn: 'root',
})
export class CartState {
  readonly items = signal<CartItemModel[]>(this.loadCart());

  readonly itemCount = computed(() =>
    this.items().reduce((total, item) => total + item.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this.items().reduce((total, item) => total + item.book.price * item.quantity, 0)
  );

  readonly shippingFee = computed(() => {
    // Storewide free nationwide delivery (as advertised in top banner)
    return 0;
  });

  readonly grandTotal = computed(() => this.subtotal() + this.shippingFee());

  addToCart(book: BookModel, quantity = 1): void {
    const current = this.items();
    const existingIndex = current.findIndex((i) => i.book.id === book.id);

    if (existingIndex > -1) {
      const updated = [...current];
      const newQty = updated[existingIndex].quantity + quantity;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: Math.min(newQty, book.stockQuantity || 99),
        totalPrice: updated[existingIndex].unitPrice * Math.min(newQty, book.stockQuantity || 99),
      };
      this.items.set(updated);
    } else {
      const newItem: CartItemModel = {
        bookId: book.id,
        book,
        quantity: Math.min(quantity, book.stockQuantity || 99),
        unitPrice: book.price,
        totalPrice: book.price * Math.min(quantity, book.stockQuantity || 99),
      };
      this.items.set([...current, newItem]);
    }
    this.saveCart();
  }

  updateQuantity(bookId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(bookId);
      return;
    }
    const current = this.items();
    const updated = current.map((item) => {
      if (item.book.id === bookId) {
        const validQty = Math.min(quantity, item.book.stockQuantity || 99);
        return {
          ...item,
          quantity: validQty,
          totalPrice: item.unitPrice * validQty,
        };
      }
      return item;
    });
    this.items.set(updated);
    this.saveCart();
  }

  removeItem(bookId: number): void {
    const filtered = this.items().filter((i) => i.book.id !== bookId);
    this.items.set(filtered);
    this.saveCart();
  }

  removeFromCart(bookId: number): void {
    this.removeItem(bookId);
  }

  clearCart(): void {
    this.items.set([]);
    this.saveCart();
  }

  private saveCart(): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items()));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }

  private loadCart(): CartItemModel[] {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }
}
