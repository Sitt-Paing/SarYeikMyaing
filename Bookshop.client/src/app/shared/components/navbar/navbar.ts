import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CategoryModel } from '../../../core/models/category.model';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { CategoryService } from '../../../core/services/category.service';
import { MmkCurrencyPipe } from '../../pipes/mmk-currency.pipe';
import { Logo } from '../logo/logo';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, Logo, MmkCurrencyPipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit {
  readonly authService = inject(AuthService);
  readonly cartService = inject(CartService);
  readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);

  categories: CategoryModel[] = [];
  searchQuery = '';
  isMobileMenuOpen = signal<boolean>(false);

  ngOnInit(): void {
    this.categoryService.get().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.categories = res.data as CategoryModel[];
        }
      },
    });
  }

  onSearch(event: Event): void {
    event.preventDefault();
    if (this.searchQuery.trim()) {
      this.router.navigate(['/books'], { queryParams: { q: this.searchQuery.trim() } });
      this.isMobileMenuOpen.set(false);
    }
  }
}
