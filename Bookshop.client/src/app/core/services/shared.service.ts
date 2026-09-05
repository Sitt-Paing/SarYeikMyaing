import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private readonly USERNAME_KEY = 'userName';
  private readonly EMAIL_KEY = 'email';
  private readonly ROLES_KEY = 'userRoles';
  private readonly TOKEN_KEY = 'token';
  private readonly THEME_KEY = 'theme';

  sidebarCollapsed = signal<boolean>(false);
  isDarkMode = signal<boolean>(this.loadDarkModePreference());

  public userNameSignal = signal<string>(this.getStoredUserName());
  public userRolesSignal = signal<string[]>(this.getStoredUserRoles());
  public tokenSignal = signal<string | null>(this.getStoredToken());

  constructor() {
    this.applyDarkModeClass(this.isDarkMode());
  }

  // --- User Session State ---

  storeUserData(token: string, userName: string, email: string, roles: string[]): void {
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

  getUserName(): string {
    return this.userNameSignal();
  }

  getUserInitial(): string {
    const name = this.getUserName();
    return (name && name.length > 0 ? name.charAt(0) : 'U').toUpperCase();
  }

  getToken(): string | null {
    return this.tokenSignal();
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

  // --- UI Preferences ---

  private loadDarkModePreference(): boolean {
    const saved = localStorage.getItem(this.THEME_KEY);
    return saved === 'dark';
  }

  private applyDarkModeClass(dark: boolean): void {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((val) => !val);
  }

  toggleDarkMode(): void {
    this.isDarkMode.update((val) => {
      const next = !val;
      localStorage.setItem(this.THEME_KEY, next ? 'dark' : 'light');
      this.applyDarkModeClass(next);
      return next;
    });
  }
}
