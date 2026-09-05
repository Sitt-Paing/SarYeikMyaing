import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SharedService } from '../services/shared.service';

export const authGuard: CanActivateFn = () => {
  const sharedService = inject(SharedService);
  const router = inject(Router);
  const messageService = inject(MessageService);

  if (sharedService.isAuthenticated()) {
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
  const sharedService = inject(SharedService);
  const router = inject(Router);
  const messageService = inject(MessageService);

  if (sharedService.isAuthenticated() && sharedService.isAdmin()) {
    return true;
  }

  if (!sharedService.isAuthenticated()) {
    messageService.add({
      severity: 'warn',
      summary: 'Admin Login Required',
      detail: 'Please log in with an administrator account to access the management portal.',
    });
    router.navigate(['/auth/login']);
    return false;
  }

  messageService.add({
    severity: 'error',
    summary: 'Access Denied',
    detail: 'Administrator privileges required.',
  });
  router.navigate(['/']);
  return false;
};
