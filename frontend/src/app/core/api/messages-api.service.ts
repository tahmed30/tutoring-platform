import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PATHS } from './api.config';
import { Message } from '../models';

@Injectable({ providedIn: 'root' })
export class MessagesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = API_BASE_URL;

  list(): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.base}${API_PATHS.messages}`);
  }

  send(payload: { receiverId: string; messageBody: string }): Observable<Message> {
    return this.http.post<Message>(`${this.base}${API_PATHS.messages}`, payload);
  }

  markRead(id: string): Observable<Message> {
    return this.http.patch<Message>(`${this.base}${API_PATHS.messages}/${id}/read`, {});
  }
}
