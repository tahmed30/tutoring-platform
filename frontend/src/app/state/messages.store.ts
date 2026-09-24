import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { MessagesApiService } from '../core/api/messages-api.service';
import { Message } from '../core/models';

@Injectable({ providedIn: 'root' })
export class MessagesStore {
  private readonly api = inject(MessagesApiService);

  private readonly messagesSignal = signal<Message[]>([]);
  private readonly loadingSignal = signal(false);

  readonly messages = this.messagesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly unreadCount = computed(
    () => this.messagesSignal().filter((m) => !m.readAt).length,
  );

  load(): void {
    this.loadingSignal.set(true);
    this.api
      .list()
      .pipe(
        tap((messages) => this.messagesSignal.set(messages)),
        catchError(() => {
          this.messagesSignal.set([]);
          return of([]);
        }),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe();
  }

  send(receiverId: string, messageBody: string): void {
    this.api.send({ receiverId, messageBody }).subscribe({
      next: (message) => {
        this.messagesSignal.update((rows) => [message, ...rows]);
      },
    });
  }

  markRead(id: string): void {
    this.api.markRead(id).subscribe({
      next: (updated) => {
        this.messagesSignal.update((rows) =>
          rows.map((row) => (row.id === id ? { ...row, ...updated } : row)),
        );
      },
    });
  }

  setMessages(messages: Message[]): void {
    this.messagesSignal.set(messages);
  }
}
