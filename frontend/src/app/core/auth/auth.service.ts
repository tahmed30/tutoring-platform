import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, switchMap, tap, throwError } from 'rxjs';
import { AuthApiService } from '../api/auth-api.service';
import { LoginRequest, RegisterRequest, RoleName, User } from '../models';
import { AuthStore } from '../../state/auth.store';
import { SettingsStore } from '../../state/settings.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApiService);
  private readonly authStore = inject(AuthStore);
  private readonly settings = inject(SettingsStore);
  private readonly router = inject(Router);

  private refreshInFlight: Observable<string> | null = null;

  login(payload: LoginRequest): Observable<User> {
    return this.api.login(payload).pipe(
      tap((res) => {
        this.authStore.setSession(res.user, res.accessToken, res.refreshToken);
        this.settings.setLanguageFromProfile(res.user.preferredLanguage);
      }),
      map((res) => res.user),
    );
  }

  register(payload: RegisterRequest): Observable<User> {
    return this.api.register(payload).pipe(
      tap((res) => {
        this.authStore.setSession(res.user, res.accessToken, res.refreshToken);
        this.settings.setLanguageFromProfile(res.user.preferredLanguage);
      }),
      map((res) => res.user),
    );
  }

  logout(): void {
    const refreshToken = this.authStore.getRefreshToken() ?? undefined;
    this.api.logout(refreshToken).pipe(catchError(() => of(void 0))).subscribe();
    this.authStore.clear();
    void this.router.navigate(['/login']);
  }

  tryRestoreSession(): Observable<boolean> {
    const refreshToken = this.authStore.getRefreshToken();
    if (!refreshToken) {
      return of(false);
    }
    return this.refreshAccessToken().pipe(
      switchMap(() => this.api.me()),
      tap((user) => {
        this.authStore.setUser(user);
        this.settings.setLanguageFromProfile(user.preferredLanguage);
      }),
      map(() => true),
      catchError(() => {
        this.authStore.clear();
        return of(false);
      }),
    );
  }

  refreshAccessToken(): Observable<string> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    const refreshToken = this.authStore.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }
    this.refreshInFlight = this.api.refresh(refreshToken).pipe(
      tap((tokens) => {
        this.authStore.setAccessToken(tokens.accessToken);
        if (tokens.refreshToken) {
          localStorage.setItem('tp_refresh_token', tokens.refreshToken);
        }
      }),
      map((tokens) => tokens.accessToken),
      catchError((err) => {
        this.authStore.clear();
        return throwError(() => err);
      }),
      finalize(() => {
        this.refreshInFlight = null;
      }),
    );
    return this.refreshInFlight;
  }

  dashboardPathForRole(role: RoleName | null): string {
    switch (role) {
      case 'STUDENT':
        return '/dashboard/student';
      case 'PARENT':
        return '/dashboard/parent';
      case 'TEACHER':
        return '/dashboard/teacher';
      case 'ADMIN':
        return '/dashboard/admin';
      default:
        return '/login';
    }
  }

  syncPreferredLanguage(): void {
    if (!this.authStore.isAuthenticated()) return;
    this.api.updatePreferredLanguage(this.settings.toPreferredLanguage()).subscribe({
      next: (user) => this.authStore.setUser(user),
    });
  }
}
