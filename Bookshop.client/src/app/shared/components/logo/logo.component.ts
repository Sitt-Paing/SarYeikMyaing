import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
})
export class LogoComponent {
  size = input<'sm' | 'md' | 'lg'>('md');
  showText = input<boolean>(true);
  linkUrl = input<string>('/');

  get iconSizeClass(): () => string {
    return () => {
      switch (this.size()) {
        case 'sm': return 'w-8 h-8';
        case 'lg': return 'w-14 h-14';
        default: return 'w-10 h-10';
      }
    };
  }

  get titleSizeClass(): () => string {
    return () => {
      switch (this.size()) {
        case 'sm': return 'text-lg';
        case 'lg': return 'text-2xl';
        default: return 'text-xl';
      }
    };
  }
}
