import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notification = inject(NotificationService);

  if (authService.isAuthenticated()) {
    return true;
  }

  notification.warn('Login Required', 'Please log in to access this page.');
  router.navigate(['/auth/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notification = inject(NotificationService);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  notification.error('Access Denied', 'Administrator privileges required.');
  router.navigate(['/']);
  return false;
};
