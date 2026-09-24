import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../../state/auth.store';
import { CoursesStore } from '../../../state/courses.store';
import { GradebookStore } from '../../../state/gradebook.store';
import { AttendanceStore } from '../../../state/attendance.store';
import { MessagesStore } from '../../../state/messages.store';
import { PaymentsApiService } from '../../../core/api/payments-api.service';
import { UsersApiService } from '../../../core/api/users-api.service';
import { Payment, User } from '../../../core/models';
import {
  DEMO_ATTENDANCE,
  DEMO_COURSES,
  DEMO_GRADES,
  DEMO_MESSAGES,
  DEMO_PAYMENTS,
  DEMO_USERS,
} from '../../../core/demo-data';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-parent-dashboard',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule, TranslateModule],
  templateUrl: './parent-dashboard.html',
  styleUrl: './parent-dashboard.scss',
})
export class ParentDashboardComponent implements OnInit {
  readonly auth = inject(AuthStore);
  readonly courses = inject(CoursesStore);
  readonly grades = inject(GradebookStore);
  readonly attendance = inject(AttendanceStore);
  readonly messages = inject(MessagesStore);
  private readonly paymentsApi = inject(PaymentsApiService);
  private readonly usersApi = inject(UsersApiService);

  readonly children = signal<User[]>([]);
  readonly payments = signal<Payment[]>([]);

  ngOnInit(): void {
    this.courses.load();
    this.grades.load();
    this.attendance.load();
    this.messages.load();
    this.usersApi
      .children()
      .pipe(catchError(() => of(DEMO_USERS.filter((u) => u.role.name === 'STUDENT'))))
      .subscribe((kids) => this.children.set(kids));
    this.paymentsApi
      .list()
      .pipe(catchError(() => of(DEMO_PAYMENTS)))
      .subscribe((rows) => this.payments.set(rows));

    setTimeout(() => {
      if (!this.courses.courses().length) this.courses.setCourses(DEMO_COURSES);
      if (!this.grades.grades().length) this.grades.setGrades(DEMO_GRADES);
      if (!this.attendance.records().length) this.attendance.setRecords(DEMO_ATTENDANCE);
      if (!this.messages.messages().length) this.messages.setMessages(DEMO_MESSAGES);
    }, 800);
  }
}
