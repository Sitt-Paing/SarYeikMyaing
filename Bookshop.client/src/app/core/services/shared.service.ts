import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private readonly USERNAME_KEY = 'userName';
  private readonly EMAIL_KEY = 'email';
  private readonly ROLES_KEY = 'userRoles';
  private readonly THEME_KEY = 'theme';

  sidebarCollapsed = signal<boolean>(false);
  isDarkMode = signal<boolean>(this.loadDarkModePreference());

  public userNameSignal = signal<string>(this.getStoredUserName());
  public userRolesSignal = signal<string[]>(this.getStoredUserRoles());

  constructor() {
    this.applyDarkModeClass(this.isDarkMode());
    // Clean up any legacy sensitive tokens from local storage if present
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('TOKEN_KEY');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  // --- User Session State ---

  storeUserData(userName: string, email: string, roles: string[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.USERNAME_KEY, userName);
      localStorage.setItem(this.EMAIL_KEY, email);
      localStorage.setItem(this.ROLES_KEY, JSON.stringify(roles));
    }

    this.userNameSignal.set(userName);
    this.userRolesSignal.set(roles);
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.USERNAME_KEY);
      localStorage.removeItem(this.EMAIL_KEY);
      localStorage.removeItem(this.ROLES_KEY);
      localStorage.removeItem('token');
    }
    this.userNameSignal.set('Guest');
    this.userRolesSignal.set([]);
  }

  isAuthenticated(): boolean {
    return this.userNameSignal() !== 'Guest' && this.userNameSignal().trim() !== '';
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

  private getStoredUserName(): string {
    if (typeof localStorage === 'undefined') return 'Guest';
    return localStorage.getItem(this.USERNAME_KEY) ?? 'Guest';
  }

  private getStoredUserRoles(): string[] {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(this.ROLES_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return [raw];
      }
    }
    return [];
  }

  // --- UI Preferences ---

  private loadDarkModePreference(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const saved = localStorage.getItem(this.THEME_KEY);
    return saved === 'dark';
  }

  private applyDarkModeClass(dark: boolean): void {
    if (typeof document !== 'undefined') {
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((val) => !val);
  }

  toggleDarkMode(): void {
    this.isDarkMode.update((val) => {
      const next = !val;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.THEME_KEY, next ? 'dark' : 'light');
      }
      this.applyDarkModeClass(next);
      return next;
    });
  }
}
