import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../core/services/auth.service';
import { Logo } from '../../../shared/components/logo/logo';

@Component({
  selector: 'app-register',
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
  templateUrl: './register.html',
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly formBuilder = inject(FormBuilder);

  public registerForm = this.formBuilder.group({
    userName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
    role: ['User'],
  });

  isLoading = false;

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (this.registerForm.value.password !== this.registerForm.value.confirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Mismatch',
        detail: 'Passwords do not match.',
      });
      return;
    }

    this.isLoading = true;
    const model = {
      userName: this.registerForm.value.userName!,
      email: this.registerForm.value.email!,
      phoneNumber: this.registerForm.value.phoneNumber || '',
      password: this.registerForm.value.password!,
      confirmPassword: this.registerForm.value.confirmPassword || '',
      role: 'User',
    };

    this.authService.register(model).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Registration Successful',
            detail: 'Please sign in with your account.',
          });
          this.router.navigate(['/auth/login']);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Registration Failed',
            detail: res.message || 'Could not complete registration.',
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Registration Failed',
          detail: err.error?.message || 'Server error',
        });
      },
    });
  }
}
