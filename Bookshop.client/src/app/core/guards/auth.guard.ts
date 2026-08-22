import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const messageService = inject(MessageService);

  if (authService.isAuthenticated()) {
    return true;
  }

  messageService.add({
    severity: 'warn',
    summary: 'Login Required',
    detail: 'Please log in to access this page.',
  });
  router.navigate(['/auth/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const messageService = inject(MessageService);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  messageService.add({
    severity: 'error',
    summary: 'Access Denied',
    detail: 'Administrator privileges required.',
  });
  router.navigate(['/']);
  return false;
};
