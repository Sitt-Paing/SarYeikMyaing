import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  severity: 'success' | 'info' | 'warn' | 'error';
  summary: string;
  detail: string;
  life?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  readonly toasts = signal<ToastMessage[]>([]);

  show(severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string, life = 3500) {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, severity, summary, detail, life };
    this.toasts.update((current) => [...current, toast]);

    setTimeout(() => {
      this.remove(id);
    }, life);
  }

  success(summary: string, detail: string = '') {
    this.show('success', summary, detail);
  }

  error(summary: string, detail: string = '') {
    this.show('error', summary, detail, 4500);
  }

  info(summary: string, detail: string = '') {
    this.show('info', summary, detail);
  }

  warn(summary: string, detail: string = '') {
    this.show('warn', summary, detail);
  }

  remove(id: string) {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
