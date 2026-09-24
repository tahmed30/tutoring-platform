import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PATHS } from './api.config';
import { Course, Paginated, Subject } from '../models';

export interface CourseFilters {
  subjectId?: string;
  teacherId?: string;
  gradeLevel?: string;
  q?: string;
}

@Injectable({ providedIn: 'root' })
export class CoursesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = API_BASE_URL;

  list(filters?: CourseFilters): Observable<Course[] | Paginated<Course>> {
    let params = new HttpParams();
    if (filters?.subjectId) params = params.set('subjectId', filters.subjectId);
    if (filters?.teacherId) params = params.set('teacherId', filters.teacherId);
    if (filters?.gradeLevel) params = params.set('gradeLevel', filters.gradeLevel);
    if (filters?.q) params = params.set('q', filters.q);
    return this.http.get<Course[] | Paginated<Course>>(`${this.base}${API_PATHS.courses}`, {
      params,
    });
  }

  getById(id: string): Observable<Course> {
    return this.http.get<Course>(`${this.base}${API_PATHS.courses}/${id}`);
  }

  create(payload: Partial<Course>): Observable<Course> {
    return this.http.post<Course>(`${this.base}${API_PATHS.courses}`, payload);
  }

  update(id: string, payload: Partial<Course>): Observable<Course> {
    return this.http.patch<Course>(`${this.base}${API_PATHS.courses}/${id}`, payload);
  }

  listSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.base}${API_PATHS.subjects}`);
  }

  myCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.base}${API_PATHS.courses}/mine`);
  }
}
