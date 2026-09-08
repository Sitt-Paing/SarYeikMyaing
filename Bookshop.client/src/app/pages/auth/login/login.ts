import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../core/services/auth.service';
import { SharedService } from '../../../core/services/shared.service';
import { Logo } from '../../../shared/components/logo/logo';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    ToastModule,
    Logo,
  ],
  providers: [MessageService],
  templateUrl: './login.html',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly sharedService = inject(SharedService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly formBuilder = inject(FormBuilder);

  public loginForm = this.formBuilder.group({
    userNameOrEmail: ['', Validators.required],
    password: ['', Validators.required],
    rememberMe: [true],
  });

  showPassword = false;
  isLoading = false;

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const model = {
      userNameOrEmail: this.loginForm.value.userNameOrEmail!,
      password: this.loginForm.value.password!,
      rememberMe: this.loginForm.value.rememberMe || false,
    };

    this.authService.login(model).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          const user = res.data;
          const roles = user.roles || user.Roles || ['User'];
          const userName = user.userName || user.UserName || model.userNameOrEmail;
          const email = user.email || user.Email || model.userNameOrEmail;

          this.sharedService.storeUserData(userName, email, roles);

          this.messageService.add({
            severity: 'success',
            summary: 'Welcome!',
            detail: 'Logged in successfully.',
          });
          if (this.sharedService.isAdmin()) {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/']);
          }
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Login Failed',
            detail: res.message || 'Invalid credentials',
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Login Failed',
          detail: err.error?.message || 'Invalid credentials',
        });
      },
    });
  }
}
