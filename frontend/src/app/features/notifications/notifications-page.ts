import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationsStore } from '../../state/notifications.store';
import { DEMO_NOTIFICATIONS } from '../../core/demo-data';

@Component({
  selector: 'app-notifications-page',
  imports: [DatePipe, MatButtonModule, MatListModule, MatIconModule, TranslateModule],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.scss',
})
export class NotificationsPageComponent implements OnInit {
  readonly store = inject(NotificationsStore);

  ngOnInit(): void {
    this.store.load();
    setTimeout(() => {
      if (!this.store.items().length) this.store.setItems(DEMO_NOTIFICATIONS);
    }, 800);
  }
}
