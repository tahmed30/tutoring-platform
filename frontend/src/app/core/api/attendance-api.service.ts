import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PATHS } from './api.config';
import { AttendanceRecord, AttendanceStatus } from '../models';

@Injectable({ providedIn: 'root' })
export class AttendanceApiService {
  private readonly http = inject(HttpClient);
  private readonly base = API_BASE_URL;

  list(filters?: {
    courseId?: string;
    studentId?: string;
    from?: string;
    to?: string;
  }): Observable<AttendanceRecord[]> {
    let params = new HttpParams();
    if (filters?.courseId) params = params.set('courseId', filters.courseId);
    if (filters?.studentId) params = params.set('studentId', filters.studentId);
    if (filters?.from) params = params.set('from', filters.from);
    if (filters?.to) params = params.set('to', filters.to);
    return this.http.get<AttendanceRecord[]>(`${this.base}${API_PATHS.attendance}`, { params });
  }

  create(payload: Partial<AttendanceRecord>): Observable<AttendanceRecord> {
    return this.http.post<AttendanceRecord>(`${this.base}${API_PATHS.attendance}`, payload);
  }

  update(
    id: string,
    payload: { status?: AttendanceStatus; notes?: string | null },
  ): Observable<AttendanceRecord> {
    return this.http.patch<AttendanceRecord>(`${this.base}${API_PATHS.attendance}/${id}`, payload);
  }
}
