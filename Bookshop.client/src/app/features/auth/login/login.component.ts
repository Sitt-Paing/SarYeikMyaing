import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginDto } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LogoComponent } from '../../../shared/components/logo/logo.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LogoComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  loginData: LoginDto = {
    userNameOrEmail: '',
    password: '',
    rememberMe: true,
  };

  showPassword = false;
  isLoading = false;

  onLogin(event: Event): void {
    event.preventDefault();
    if (!this.loginData.userNameOrEmail || !this.loginData.password) {
      this.notification.warn('Required', 'Please enter your username and password.');
      return;
    }

    this.isLoading = true;
    this.authService.login(this.loginData).subscribe({
      next: (success) => {
        this.isLoading = false;
        if (success) {
          if (this.authService.isAdmin()) {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/']);
          }
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
