import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartState } from '../../core/state/cart.state';
import { MmkCurrencyPipe } from '../../shared/pipes/mmk-currency.pipe';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MmkCurrencyPipe, TranslatePipe],
  templateUrl: './cart.html',
})
export class Cart {
  readonly cartService = inject(CartState);
}
