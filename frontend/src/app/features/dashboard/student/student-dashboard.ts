import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../state/auth.store';
import { CoursesStore } from '../../state/courses.store';
import { AttendanceStore } from '../../state/attendance.store';
import { GradebookStore } from '../../state/gradebook.store';
import { NotificationsStore } from '../../state/notifications.store';
import { MessagesStore } from '../../state/messages.store';
import {
  DEMO_ATTENDANCE,
  DEMO_COURSES,
  DEMO_GRADES,
  DEMO_MESSAGES,
  DEMO_NOTIFICATIONS,
} from '../../core/demo-data';

@Component({
  selector: 'app-student-dashboard',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule, TranslateModule],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.scss',
})
export class StudentDashboardComponent implements OnInit {
  readonly auth = inject(AuthStore);
  readonly courses = inject(CoursesStore);
  readonly attendance = inject(AttendanceStore);
  readonly grades = inject(GradebookStore);
  readonly notifications = inject(NotificationsStore);
  readonly messages = inject(MessagesStore);

  ngOnInit(): void {
    this.courses.load();
    this.attendance.load();
    this.grades.load();
    this.notifications.load();
    this.messages.load();

    // Seed demo placeholders when API is offline.
    setTimeout(() => {
      if (!this.courses.courses().length) this.courses.setCourses(DEMO_COURSES);
      if (!this.attendance.records().length) this.attendance.setRecords(DEMO_ATTENDANCE);
      if (!this.grades.grades().length) this.grades.setGrades(DEMO_GRADES);
      if (!this.notifications.items().length) this.notifications.setItems(DEMO_NOTIFICATIONS);
      if (!this.messages.messages().length) this.messages.setMessages(DEMO_MESSAGES);
    }, 800);
  }
}
