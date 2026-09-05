import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SharedService } from '../services/shared.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sharedService = inject(SharedService);
  const router = inject(Router);

  const token = sharedService.tokenSignal() || localStorage.getItem('token');
  let headers = req.headers;

  if (token && !headers.has('Authorization')) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  const authReq = req.clone({
    headers,
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        sharedService.logout();
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
