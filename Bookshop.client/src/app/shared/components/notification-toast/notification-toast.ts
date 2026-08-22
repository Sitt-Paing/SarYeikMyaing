import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule, ToastModule],
  templateUrl: './notification-toast.html',
  styleUrl: './notification-toast.scss',
})
export class NotificationToast {}
