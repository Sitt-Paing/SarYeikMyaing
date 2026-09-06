import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginModel, RegisterModel } from '../models/auth.model';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private refreshToken$: Observable<RootModel> | null = null;

  login(model: LoginModel): Observable<RootModel> {
    const url = `${environment.main_url}/Account/Login`;
    const payload = {
      userNameOrEmailOrPhone: model.userNameOrEmail || (model as any).userNameOrEmailOrPhone || '',
      password: model.password,
      rememberMe: (model as any).rememberMe ?? false,
    };
    return this.http.post<RootModel>(url, payload, { withCredentials: true });
  }

  register(model: RegisterModel): Observable<RootModel> {
    const url = `${environment.main_url}/Account/Register`;
    return this.http.post<RootModel>(url, model, { withCredentials: true });
  }

  refreshToken(): Observable<RootModel> {
    if (this.refreshToken$) {
      return this.refreshToken$;
    }

    const url = `${environment.main_url}/Account/refresh`;
    this.refreshToken$ = this.http.post<RootModel>(url, {}, { withCredentials: true }).pipe(
      catchError(() => of({ success: false, message: 'Session expired.' } as RootModel)),
      finalize(() => {
        this.refreshToken$ = null;
      }),
      shareReplay(1)
    );

    return this.refreshToken$;
  }

  logout(): Observable<RootModel> {
    const url = `${environment.main_url}/Account/Logout`;
    return this.http.post<RootModel>(url, {}, { withCredentials: true }).pipe(
      catchError(() => of({ success: true, message: 'Logged out.' } as RootModel))
    );
  }

  getProfile(): Observable<RootModel> {
    const url = `${environment.main_url}/Account/me`;
    return this.http.get<RootModel>(url, { withCredentials: true });
  }

  getCsrfToken(): Observable<RootModel> {
    const url = `${environment.main_url}/Account/csrf-token`;
    return this.http.get<RootModel>(url, { withCredentials: true });
  }

  public getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  }
}
