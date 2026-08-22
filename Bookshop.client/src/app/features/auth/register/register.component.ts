import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegisterDto } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LogoComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  registerData: RegisterDto = {
    userName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'User',
  };

  isLoading = false;

  onRegister(event: Event): void {
    event.preventDefault();

    if (!this.registerData.userName || !this.registerData.email || !this.registerData.password) {
      this.notification.warn('Required', 'Please complete all required fields.');
      return;
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.notification.error('Mismatch', 'Passwords do not match.');
      return;
    }

    this.isLoading = true;
    this.authService.register(this.registerData).subscribe({
      next: (success) => {
        this.isLoading = false;
        if (success) {
          this.router.navigate(['/auth/login']);
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
