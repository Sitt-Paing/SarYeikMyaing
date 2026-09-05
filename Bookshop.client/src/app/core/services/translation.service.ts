import { Injectable, signal, computed } from '@angular/core';
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, LanguageCode, LanguageOption } from '../i18n/languages';
import { EN_DICTIONARY } from '../i18n/en';
import { MM_DICTIONARY } from '../i18n/mm';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly STORAGE_KEY = 'app_language';

  public readonly languages: LanguageOption[] = AVAILABLE_LANGUAGES;

  private dictionaries: Record<LanguageCode, Record<string, any>> = {
    en: EN_DICTIONARY,
    mm: MM_DICTIONARY,
  };

  public currentLanguage = signal<LanguageCode>(this.loadInitialLanguage());

  public currentLanguageOption = computed(() => {
    const code = this.currentLanguage();
    return this.languages.find((l) => l.code === code) || this.languages[0];
  });

  constructor() {
    this.updateHtmlLang(this.currentLanguage());
  }

  private loadInitialLanguage(): LanguageCode {
    if (typeof localStorage === 'undefined') return DEFAULT_LANGUAGE;
    const saved = localStorage.getItem(this.STORAGE_KEY) as LanguageCode;
    if (saved && (saved === 'en' || saved === 'mm')) {
      return saved;
    }
    return DEFAULT_LANGUAGE;
  }

  public setLanguage(code: LanguageCode): void {
    if (this.currentLanguage() === code) return;
    this.currentLanguage.set(code);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, code);
    }
    this.updateHtmlLang(code);
  }

  public toggleLanguage(): void {
    const next: LanguageCode = this.currentLanguage() === 'en' ? 'mm' : 'en';
    this.setLanguage(next);
  }

  public translate(key: string, params?: Record<string, string | number>): string {
    if (!key) return '';

    const lang = this.currentLanguage();
    const dictionary = this.dictionaries[lang] || this.dictionaries.en;

    const parts = key.split('.');
    let value: any = dictionary;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        // Fallback to English
        value = this.getFallback(key);
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    if (params) {
      Object.keys(params).forEach((paramKey) => {
        value = value.replace(new RegExp(`{${paramKey}}`, 'g'), String(params[paramKey]));
      });
    }

    return value;
  }

  private getFallback(key: string): string {
    const parts = key.split('.');
    let value: any = this.dictionaries.en;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return key;
      }
    }
    return typeof value === 'string' ? value : key;
  }

  private updateHtmlLang(code: LanguageCode): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = code === 'mm' ? 'my' : 'en';
    }
  }
}
