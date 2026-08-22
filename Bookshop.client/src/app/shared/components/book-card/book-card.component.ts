import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Book } from '../../../core/models/book.model';
import { CartService } from '../../../core/services/cart.service';
import { MmkCurrencyPipe } from '../../pipes/mmk-currency.pipe';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MmkCurrencyPipe],
  templateUrl: './book-card.component.html',
  styleUrl: './book-card.component.scss',
})
export class BookCardComponent {
  private readonly cartService = inject(CartService);
  book = input.required<Book>();

  onAddToCart(event: Event): void {
    event.stopPropagation();
    this.cartService.addToCart(this.book(), 1);
  }
}
