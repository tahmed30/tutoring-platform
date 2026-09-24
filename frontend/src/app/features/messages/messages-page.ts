import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { TranslatePipe } from '@ngx-translate/core';
import { MessagesStore } from '../../state/messages.store';
import { DEMO_MESSAGES } from '../../core/demo-data';

@Component({
  selector: 'app-messages-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    TranslatePipe,
  ],
  templateUrl: './messages-page.html',
  styleUrl: './messages-page.scss',
})
export class MessagesPageComponent implements OnInit {
  readonly store = inject(MessagesStore);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    receiverId: ['', Validators.required],
    messageBody: ['', Validators.required],
  });

  ngOnInit(): void {
    this.store.load();
    setTimeout(() => {
      if (!this.store.messages().length) this.store.setMessages(DEMO_MESSAGES);
    }, 800);
  }

  send(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { receiverId, messageBody } = this.form.getRawValue();
    this.store.send(receiverId, messageBody);
    this.form.reset();
  }
}
