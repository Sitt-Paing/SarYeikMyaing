import { Component, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SharedService } from '../../core/services/shared.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { OrderService } from '../../core/services/order.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { Logo } from '../../shared/components/logo/logo';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo, TranslatePipe],
  templateUrl: './admin.html',
  host: {
    class: 'block min-h-screen bg-slate-100',
  },
})
export class Admin implements OnInit {
  readonly sharedService = inject(SharedService);
  private readonly authService = inject(AuthService);
  readonly translationService = inject(TranslationService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  pendingOrdersCount = signal<number>(0);
  mobileMenuOpen = signal<boolean>(false);

  ngOnInit(): void {
    this.checkPendingOrders();

    // Auto-close mobile sidebar drawer on navigation
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeMobileMenu();
      });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  checkPendingOrders(): void {
    this.orderService.getPending().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const list = res.data as any[];
          this.pendingOrdersCount.set(list.length);
        }
      },
    });
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.sharedService.logout();
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.sharedService.logout();
        this.router.navigate(['/auth/login']);
      },
    });
  }
}
