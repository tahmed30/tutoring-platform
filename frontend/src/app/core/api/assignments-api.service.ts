import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_PATHS } from './api.config';
import { Assignment, AssignmentSubmission } from '../models';

@Injectable({ providedIn: 'root' })
export class AssignmentsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = API_BASE_URL;

  list(filters?: { courseId?: string }): Observable<Assignment[]> {
    let params = new HttpParams();
    if (filters?.courseId) params = params.set('courseId', filters.courseId);
    return this.http.get<Assignment[]>(`${this.base}${API_PATHS.assignments}`, { params });
  }

  create(payload: Partial<Assignment>): Observable<Assignment> {
    return this.http.post<Assignment>(`${this.base}${API_PATHS.assignments}`, payload);
  }

  listSubmissions(filters?: {
    assignmentId?: string;
    courseId?: string;
  }): Observable<AssignmentSubmission[]> {
    let params = new HttpParams();
    if (filters?.assignmentId) params = params.set('assignmentId', filters.assignmentId);
    if (filters?.courseId) params = params.set('courseId', filters.courseId);
    return this.http.get<AssignmentSubmission[]>(`${this.base}${API_PATHS.submissions}`, {
      params,
    });
  }

  submit(
    assignmentId: string,
    payload: { submissionFileUrl?: string },
  ): Observable<AssignmentSubmission> {
    return this.http.post<AssignmentSubmission>(
      `${this.base}${API_PATHS.assignments}/${assignmentId}/submissions`,
      payload,
    );
  }

  gradeSubmission(
    id: string,
    payload: { grade: number; teacherFeedback?: string },
  ): Observable<AssignmentSubmission> {
    return this.http.patch<AssignmentSubmission>(
      `${this.base}${API_PATHS.submissions}/${id}`,
      payload,
    );
  }
}
