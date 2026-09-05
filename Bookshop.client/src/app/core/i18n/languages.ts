export type LanguageCode = 'en' | 'mm';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const AVAILABLE_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'mm',
    label: 'Myanmar',
    nativeLabel: 'မြန်မာ',
    flag: '🇲🇲',
  },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';
