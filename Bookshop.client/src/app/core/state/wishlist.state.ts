import { Injectable, computed, signal } from '@angular/core';
import { BookModel } from '../models/book.model';

const WISHLIST_STORAGE_KEY = 'saryeikmyaing_wishlist';

@Injectable({
  providedIn: 'root',
})
export class WishlistState {
  readonly items = signal<BookModel[]>(this.loadWishlist());

  readonly itemCount = computed(() => this.items().length);

  isInWishlist(bookId: number): boolean {
    return this.items().some((b) => b.id === bookId);
  }

  toggleWishlist(book: BookModel): boolean {
    if (this.isInWishlist(book.id)) {
      this.removeFromWishlist(book.id);
      return false;
    } else {
      this.addToWishlist(book);
      return true;
    }
  }

  addToWishlist(book: BookModel): void {
    if (!this.isInWishlist(book.id)) {
      this.items.set([book, ...this.items()]);
      this.saveWishlist();
    }
  }

  removeFromWishlist(bookId: number): void {
    this.items.set(this.items().filter((b) => b.id !== bookId));
    this.saveWishlist();
  }

  clearWishlist(): void {
    this.items.set([]);
    this.saveWishlist();
  }

  private loadWishlist(): BookModel[] {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveWishlist(): void {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(this.items()));
    } catch {
      // Ignored
    }
  }
}
