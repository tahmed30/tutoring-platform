import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppLanguage, AppTheme, PreferredLanguage } from '../core/models';

const LANGUAGE_KEY = 'tp_language';
const THEME_KEY = 'tp_theme';

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly translate = inject(TranslateService);

  private readonly languageSignal = signal<AppLanguage>(this.readLanguage());
  private readonly themeSignal = signal<AppTheme>(this.readTheme());

  readonly language = this.languageSignal.asReadonly();
  readonly theme = this.themeSignal.asReadonly();
  readonly isAmharic = computed(() => this.languageSignal() === 'am');

  constructor() {
    effect(() => {
      const lang = this.languageSignal();
      localStorage.setItem(LANGUAGE_KEY, lang);
      this.translate.use(lang);
      document.documentElement.lang = lang;
    });

    effect(() => {
      const theme = this.themeSignal();
      localStorage.setItem(THEME_KEY, theme);
      document.body.classList.toggle('theme-dark', theme === 'dark');
    });
  }

  setLanguage(lang: AppLanguage): void {
    this.languageSignal.set(lang);
  }

  setLanguageFromProfile(preferred: PreferredLanguage): void {
    this.setLanguage(preferred === 'AM' ? 'am' : 'en');
  }

  toPreferredLanguage(): PreferredLanguage {
    return this.languageSignal() === 'am' ? 'AM' : 'EN';
  }

  toggleLanguage(): void {
    this.setLanguage(this.languageSignal() === 'en' ? 'am' : 'en');
  }

  setTheme(theme: AppTheme): void {
    this.themeSignal.set(theme);
  }

  toggleTheme(): void {
    this.setTheme(this.themeSignal() === 'light' ? 'dark' : 'light');
  }

  private readLanguage(): AppLanguage {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return saved === 'am' ? 'am' : 'en';
  }

  private readTheme(): AppTheme {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  }
}
