import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { AuthResponseData, LoginDto, RegisterDto, User } from '../models/auth.model';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';

const TOKEN_KEY = 'sar_oat_sin_token';
const USER_KEY = 'sar_oat_sin_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  readonly token = signal<string | null>(this.getSavedToken());
  readonly currentUser = signal<User | null>(this.getSavedUser());

  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  readonly isAdmin = computed(() => {
    const user = this.currentUser();
    return !!user?.roles?.some((r) => r.toLowerCase() === 'admin' || r.toLowerCase() === 'devadmin');
  });

  login(dto: LoginDto): Observable<boolean> {
    return this.api.post<AuthResponseData>('Account/Login', dto).pipe(
      map((response) => {
        if (response?.success && response.data?.accessToken) {
          const user: User = response.data.user || {
            id: '1',
            userName: dto.userNameOrEmail,
            email: dto.userNameOrEmail.includes('@') ? dto.userNameOrEmail : `${dto.userNameOrEmail}@saroatsin.com`,
            roles: ['User']
          };
          this.setSession(response.data.accessToken, user);
          this.notification.success('Welcome back!', `Logged in as ${user.userName}`);
          return true;
        }
        this.notification.error('Login Failed', response?.message || 'Invalid credentials');
        return false;
      }),
      catchError((error) => {
        this.notification.error('Login Failed', error.error?.message || 'Invalid username or password');
        return of(false);
      })
    );
  }

  register(dto: RegisterDto): Observable<boolean> {
    return this.api.post<any>('Account/Register', dto).pipe(
      map((response) => {
        if (response?.success) {
          this.notification.success('Registration Successful', 'You can now log in with your credentials.');
          return true;
        }
        this.notification.error('Registration Failed', response?.message || 'Registration failed');
        return false;
      }),
      catchError((error) => {
        this.notification.error('Registration Error', error.error?.message || 'Could not complete registration');
        return of(false);
      })
    );
  }

  logout() {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.notification.info('Logged Out', 'You have been successfully logged out.');
    this.router.navigate(['/auth/login']);
  }

  private setSession(token: string, user: User) {
    this.token.set(token);
    this.currentUser.set(user);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private getSavedToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private getSavedUser(): User | null {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }
}
