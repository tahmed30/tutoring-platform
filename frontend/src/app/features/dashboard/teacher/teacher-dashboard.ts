import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../../state/auth.store';
import { CoursesStore } from '../../../state/courses.store';
import { AttendanceStore } from '../../../state/attendance.store';
import { GradebookStore } from '../../../state/gradebook.store';
import { MessagesStore } from '../../../state/messages.store';
import { DEMO_ATTENDANCE, DEMO_COURSES, DEMO_GRADES, DEMO_MESSAGES } from '../../../core/demo-data';

@Component({
  selector: 'app-teacher-dashboard',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule, TranslateModule],
  templateUrl: './teacher-dashboard.html',
  styleUrl: './teacher-dashboard.scss',
})
export class TeacherDashboardComponent implements OnInit {
  readonly auth = inject(AuthStore);
  readonly courses = inject(CoursesStore);
  readonly attendance = inject(AttendanceStore);
  readonly grades = inject(GradebookStore);
  readonly messages = inject(MessagesStore);

  ngOnInit(): void {
    this.courses.load();
    this.attendance.load();
    this.grades.load();
    this.messages.load();
    setTimeout(() => {
      if (!this.courses.courses().length) this.courses.setCourses(DEMO_COURSES);
      if (!this.attendance.records().length) this.attendance.setRecords(DEMO_ATTENDANCE);
      if (!this.grades.grades().length) this.grades.setGrades(DEMO_GRADES);
      if (!this.messages.messages().length) this.messages.setMessages(DEMO_MESSAGES);
    }, 800);
  }
}
