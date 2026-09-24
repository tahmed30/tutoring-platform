import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { NotificationsApiService } from '../core/api/notifications-api.service';
import { Notification } from '../core/models';

@Injectable({ providedIn: 'root' })
export class NotificationsStore {
  private readonly api = inject(NotificationsApiService);

  private readonly itemsSignal = signal<Notification[]>([]);
  private readonly loadingSignal = signal(false);

  readonly items = this.itemsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly unreadCount = computed(
    () => this.itemsSignal().filter((n) => !n.readStatus).length,
  );

  load(): void {
    this.loadingSignal.set(true);
    this.api
      .list()
      .pipe(
        tap((items) => this.itemsSignal.set(items)),
        catchError(() => {
          this.itemsSignal.set([]);
          return of([]);
        }),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe();
  }

  markRead(id: string): void {
    this.api.markRead(id).subscribe({
      next: (updated) => {
        this.itemsSignal.update((rows) =>
          rows.map((row) => (row.id === id ? { ...row, ...updated } : row)),
        );
      },
    });
  }

  markAllRead(): void {
    this.api.markAllRead().subscribe({
      next: () => {
        this.itemsSignal.update((rows) => rows.map((row) => ({ ...row, readStatus: true })));
      },
    });
  }

  setItems(items: Notification[]): void {
    this.itemsSignal.set(items);
  }
}
