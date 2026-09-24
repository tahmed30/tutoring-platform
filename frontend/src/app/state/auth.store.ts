import { Injectable, computed, inject, signal } from '@angular/core';
import { RoleName, User } from '../core/models';

const REFRESH_TOKEN_KEY = 'tp_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly accessTokenSignal = signal<string | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly roles = computed<RoleName[]>(() => {
    const role = this.currentUserSignal()?.role?.name;
    return role ? [role] : [];
  });
  readonly primaryRole = computed(() => this.roles()[0] ?? null);
  readonly isAuthenticated = computed(
    () => !!this.accessTokenSignal() && !!this.currentUserSignal(),
  );
  readonly displayName = computed(() => {
    const user = this.currentUserSignal();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setSession(user: User, accessToken: string, refreshToken: string): void {
    this.currentUserSignal.set(user);
    this.accessTokenSignal.set(accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  setAccessToken(accessToken: string): void {
    this.accessTokenSignal.set(accessToken);
  }

  setUser(user: User): void {
    this.currentUserSignal.set(user);
  }

  hasRole(...roles: RoleName[]): boolean {
    const current = this.primaryRole();
    return !!current && roles.includes(current);
  }

  clear(): void {
    this.currentUserSignal.set(null);
    this.accessTokenSignal.set(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

/** Convenience injection helper used by guards/interceptors. */
export function injectAuthStore(): AuthStore {
  return inject(AuthStore);
}
