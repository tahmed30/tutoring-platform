import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PATHS } from './api.config';
import { ClassSchedule, Role, User } from '../models';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = API_BASE_URL;

  list(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}${API_PATHS.admin.users}`);
  }

  update(id: string, payload: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.base}${API_PATHS.admin.users}/${id}`, payload);
  }

  listRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.base}${API_PATHS.admin.roles}`);
  }

  children(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}${API_PATHS.parents.children}`);
  }
}

@Injectable({ providedIn: 'root' })
export class SchedulesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = API_BASE_URL;

  list(filters?: { courseId?: string }): Observable<ClassSchedule[]> {
    const params: Record<string, string> = {};
    if (filters?.courseId) params['courseId'] = filters.courseId;
    return this.http.get<ClassSchedule[]>(`${this.base}${API_PATHS.schedules}`, { params });
  }
}
