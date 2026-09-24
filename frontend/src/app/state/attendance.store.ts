import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { AttendanceApiService } from '../core/api/attendance-api.service';
import { AttendanceRecord, AttendanceStatus } from '../core/models';

@Injectable({ providedIn: 'root' })
export class AttendanceStore {
  private readonly api = inject(AttendanceApiService);

  private readonly recordsSignal = signal<AttendanceRecord[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly records = this.recordsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly presentCount = computed(
    () => this.recordsSignal().filter((r) => r.status === 'PRESENT').length,
  );
  readonly absentCount = computed(
    () => this.recordsSignal().filter((r) => r.status === 'ABSENT').length,
  );

  load(filters?: { courseId?: string; studentId?: string }): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api
      .list(filters)
      .pipe(
        tap((records) => this.recordsSignal.set(records)),
        catchError((err) => {
          this.errorSignal.set(err?.message ?? 'Failed to load attendance');
          this.recordsSignal.set([]);
          return of([]);
        }),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe();
  }

  updateStatus(id: string, status: AttendanceStatus): void {
    this.api.update(id, { status }).subscribe({
      next: (updated) => {
        this.recordsSignal.update((rows) =>
          rows.map((row) => (row.id === id ? { ...row, ...updated } : row)),
        );
      },
    });
  }

  setRecords(records: AttendanceRecord[]): void {
    this.recordsSignal.set(records);
  }
}
