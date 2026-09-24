import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PATHS } from './api.config';
import { GradeRecord, GradeType } from '../models';

@Injectable({ providedIn: 'root' })
export class GradesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = API_BASE_URL;

  list(filters?: {
    courseId?: string;
    studentId?: string;
  }): Observable<GradeRecord[]> {
    let params = new HttpParams();
    if (filters?.courseId) params = params.set('courseId', filters.courseId);
    if (filters?.studentId) params = params.set('studentId', filters.studentId);
    return this.http.get<GradeRecord[]>(`${this.base}${API_PATHS.grades}`, { params });
  }

  create(payload: Partial<GradeRecord>): Observable<GradeRecord> {
    return this.http.post<GradeRecord>(`${this.base}${API_PATHS.grades}`, payload);
  }

  update(
    id: string,
    payload: { gradeValue?: number; gradeType?: GradeType },
  ): Observable<GradeRecord> {
    return this.http.patch<GradeRecord>(`${this.base}${API_PATHS.grades}/${id}`, payload);
  }
}
