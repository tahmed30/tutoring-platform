import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PATHS } from './api.config';
import {
  AuthResponse,
  AuthTokens,
  LoginRequest,
  PreferredLanguage,
  RegisterRequest,
  User,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly base = API_BASE_URL;

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}${API_PATHS.auth.login}`, payload);
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}${API_PATHS.auth.register}`, payload);
  }

  refresh(refreshToken: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${this.base}${API_PATHS.auth.refresh}`, { refreshToken });
  }

  logout(refreshToken?: string): Observable<void> {
    return this.http.post<void>(`${this.base}${API_PATHS.auth.logout}`, { refreshToken });
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.base}${API_PATHS.auth.me}`);
  }

  updatePreferredLanguage(preferredLanguage: PreferredLanguage): Observable<User> {
    return this.http.patch<User>(`${this.base}${API_PATHS.auth.me}`, { preferredLanguage });
  }
}
