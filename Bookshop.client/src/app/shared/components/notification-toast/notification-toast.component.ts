import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-toast.component.html',
  styleUrl: './notification-toast.component.scss',
})
export class NotificationToastComponent {
  readonly notification = inject(NotificationService);

  getSeverityClasses(severity: string): string {
    switch (severity) {
      case 'success':
        return 'bg-white/95 text-slate-800 border-emerald-500 shadow-emerald-500/10 border-l-4';
      case 'error':
        return 'bg-white/95 text-slate-800 border-rose-500 shadow-rose-500/10 border-l-4';
      case 'warn':
        return 'bg-white/95 text-slate-800 border-amber-500 shadow-amber-500/10 border-l-4';
      default:
        return 'bg-white/95 text-slate-800 border-brand-500 shadow-brand-500/10 border-l-4';
    }
  }

  getIconClass(severity: string): string {
    switch (severity) {
      case 'success':
        return 'pi pi-check-circle text-emerald-500';
      case 'error':
        return 'pi pi-exclamation-circle text-rose-500';
      case 'warn':
        return 'pi pi-exclamation-triangle text-amber-500';
      default:
        return 'pi pi-info-circle text-brand-500';
    }
  }
}
