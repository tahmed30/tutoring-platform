import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PATHS } from './api.config';
import { Notification } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = API_BASE_URL;

  list(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.base}${API_PATHS.notifications}`);
  }

  markRead(id: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.base}${API_PATHS.notifications}/${id}`, {
      readStatus: true,
    });
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>(`${this.base}${API_PATHS.notifications}/read-all`, {});
  }
}
