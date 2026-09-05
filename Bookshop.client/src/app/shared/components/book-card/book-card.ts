import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookModel } from '../../../core/models/book.model';
import { CartState } from '../../../core/state/cart.state';
import { MmkCurrencyPipe } from '../../pipes/mmk-currency.pipe';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MmkCurrencyPipe],
  templateUrl: './book-card.html',
  styleUrl: './book-card.scss',
})
export class BookCard {
  private readonly cartService = inject(CartState);
  book = input.required<BookModel>();

  onAddToCart(event: Event): void {
    event.stopPropagation();
    this.cartService.addToCart(this.book(), 1);
  }
}
