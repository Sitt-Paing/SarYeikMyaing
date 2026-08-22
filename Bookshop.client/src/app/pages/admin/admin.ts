import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Logo } from '../../shared/components/logo/logo';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin {
  readonly authService = inject(AuthService);
}
