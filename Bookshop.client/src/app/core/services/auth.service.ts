import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginModel, RegisterModel } from '../models/auth.model';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly USERNAME_KEY = 'userName';
  private readonly EMAIL_KEY = 'email';
  private readonly ROLES_KEY = 'userRoles';
  private readonly TOKEN_KEY = 'token';

  public userNameSignal = signal<string>(this.getStoredUserName());
  public userRolesSignal = signal<string[]>(this.getStoredUserRoles());
  public tokenSignal = signal<string | null>(this.getStoredToken());

  login(model: LoginModel): Observable<RootModel> {
    const url = `${environment.main_url}/Account/Login`;
    return this.http.post<RootModel>(url, model).pipe(
      tap((res) => {
        if (res.success && res.data) {
          const token = res.data.accessToken || res.data.token || '';
          const user = res.data.user || {};
          const roles = user.roles || ['User'];
          const userName = user.userName || model.userNameOrEmail;
          const email = user.email || model.userNameOrEmail;

          this.storeUserData(token, userName, email, roles);
        }
      })
    );
  }

  register(model: RegisterModel): Observable<RootModel> {
    const url = `${environment.main_url}/Account/Register`;
    return this.http.post<RootModel>(url, model);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    localStorage.removeItem(this.EMAIL_KEY);
    localStorage.removeItem(this.ROLES_KEY);
    this.tokenSignal.set(null);
    this.userNameSignal.set('Guest');
    this.userRolesSignal.set([]);
  }

  isAuthenticated(): boolean {
    return !!this.tokenSignal() && this.userNameSignal() !== 'Guest';
  }

  isAdmin(): boolean {
    const roles = this.userRolesSignal();
    return roles.some((r) => r.toLowerCase() === 'admin' || r.toLowerCase() === 'devadmin');
  }

  private storeUserData(token: string, userName: string, email: string, roles: string[]): void {
    if (token) {
      localStorage.setItem(this.TOKEN_KEY, token);
      this.tokenSignal.set(token);
    }
    localStorage.setItem(this.USERNAME_KEY, userName);
    localStorage.setItem(this.EMAIL_KEY, email);
    localStorage.setItem(this.ROLES_KEY, JSON.stringify(roles));

    this.userNameSignal.set(userName);
    this.userRolesSignal.set(roles);
  }

  private getStoredUserName(): string {
    return localStorage.getItem(this.USERNAME_KEY) ?? 'Guest';
  }

  private getStoredUserRoles(): string[] {
    const raw = localStorage.getItem(this.ROLES_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    return [];
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
