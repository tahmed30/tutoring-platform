import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { GradesApiService } from '../core/api/grades-api.service';
import { GradeRecord } from '../core/models';

@Injectable({ providedIn: 'root' })
export class GradebookStore {
  private readonly api = inject(GradesApiService);

  private readonly gradesSignal = signal<GradeRecord[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly grades = this.gradesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly averageGrade = computed(() => {
    const rows = this.gradesSignal();
    if (!rows.length) return 0;
    return rows.reduce((sum, row) => sum + row.gradeValue, 0) / rows.length;
  });
  readonly gradesByCourse = computed(() => {
    const map = new Map<string, GradeRecord[]>();
    for (const grade of this.gradesSignal()) {
      const key = grade.course?.title ?? grade.courseId;
      const list = map.get(key) ?? [];
      list.push(grade);
      map.set(key, list);
    }
    return map;
  });

  load(filters?: { courseId?: string; studentId?: string }): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api
      .list(filters)
      .pipe(
        tap((grades) => this.gradesSignal.set(grades)),
        catchError((err) => {
          this.errorSignal.set(err?.message ?? 'Failed to load grades');
          this.gradesSignal.set([]);
          return of([]);
        }),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe();
  }

  updateGrade(id: string, gradeValue: number): void {
    this.api.update(id, { gradeValue }).subscribe({
      next: (updated) => {
        this.gradesSignal.update((rows) =>
          rows.map((row) => (row.id === id ? { ...row, ...updated } : row)),
        );
      },
    });
  }

  setGrades(grades: GradeRecord[]): void {
    this.gradesSignal.set(grades);
  }
}
