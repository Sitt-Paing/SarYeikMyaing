import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  sidebarCollapsed = signal<boolean>(false);
  isDarkMode = signal<boolean>(this.loadDarkModePreference());

  constructor() {
    this.applyDarkModeClass(this.isDarkMode());
  }

  private loadDarkModePreference(): boolean {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  }

  private applyDarkModeClass(dark: boolean): void {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  getUserName(): string {
    return localStorage.getItem('userName') ?? 'Guest';
  }

  getUserInitial(): string {
    const name = this.getUserName();
    return (name && name.length > 0 ? name.charAt(0) : 'U').toUpperCase();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((val) => !val);
  }

  toggleDarkMode(): void {
    this.isDarkMode.update((val) => {
      const next = !val;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      this.applyDarkModeClass(next);
      return next;
    });
  }
}
