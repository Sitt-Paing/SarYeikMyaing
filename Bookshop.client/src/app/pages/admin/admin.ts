import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SharedService } from '../../core/services/shared.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { Logo } from '../../shared/components/logo/logo';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo, TranslatePipe],
  templateUrl: './admin.html',
  host: {
    class: 'block min-h-screen bg-slate-100',
  },
})
export class Admin {
  readonly sharedService = inject(SharedService);
  readonly translationService = inject(TranslationService);
}
