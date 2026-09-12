import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookModel } from '../../core/models/book.model';
import { CartState } from '../../core/state/cart.state';
import { WishlistState } from '../../core/state/wishlist.state';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, MmkCurrencyPipe],
  templateUrl: './wishlist.html',
})
export class Wishlist {
  readonly wishlistService = inject(WishlistState);
  readonly cartService = inject(CartState);

  moveToCart(book: BookModel): void {
    this.cartService.addToCart(book, 1);
    this.wishlistService.removeFromWishlist(book.id);
  }

  addAllToCart(): void {
    const items = this.wishlistService.items();
    for (const book of items) {
      if (book.stockQuantity > 0) {
        this.cartService.addToCart(book, 1);
      }
    }
  }

  removeFromWishlist(bookId: number): void {
    this.wishlistService.removeFromWishlist(bookId);
  }

  clearWishlist(): void {
    this.wishlistService.clearWishlist();
  }
}
