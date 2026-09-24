import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PATHS } from './api.config';
import { Payment } from '../models';

@Injectable({ providedIn: 'root' })
export class PaymentsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = API_BASE_URL;

  list(): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.base}${API_PATHS.payments}`);
  }

  create(payload: Partial<Payment>): Observable<Payment> {
    return this.http.post<Payment>(`${this.base}${API_PATHS.payments}`, payload);
  }
}
