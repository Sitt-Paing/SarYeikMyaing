import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CategoryModel } from '../../../core/models/category.model';
import { CategoryService } from '../../../core/services/category.service';
import { SharedService } from '../../../core/services/shared.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartState } from '../../../core/state/cart.state';
import { MmkCurrencyPipe } from '../../pipes/mmk-currency.pipe';
import { Logo } from '../logo/logo';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, Logo, MmkCurrencyPipe, TranslatePipe],
  templateUrl: './navbar.html',
  host: {
    class: 'block',
  },
})
export class Navbar implements OnInit {
  readonly sharedService = inject(SharedService);
  private readonly authService = inject(AuthService);
  readonly cartService = inject(CartState);
  readonly categoryService = inject(CategoryService);
  readonly translationService = inject(TranslationService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  categories: CategoryModel[] = [];
  searchQuery = '';
  isMobileMenuOpen = signal<boolean>(false);

  ngOnInit(): void {
    this.categoryService.get().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.categories = (Array.isArray(res.data) ? res.data : (res.data.records || [])) as CategoryModel[];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
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

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.sharedService.logout();
        this.router.navigate(['/']);
      },
      error: () => {
        this.sharedService.logout();
        this.router.navigate(['/']);
      },
    });
  }
}
