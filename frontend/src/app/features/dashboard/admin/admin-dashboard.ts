import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '../../../state/auth.store';
import { CoursesStore } from '../../../state/courses.store';
import { UsersApiService } from '../../../core/api/users-api.service';
import { PaymentsApiService } from '../../../core/api/payments-api.service';
import { Payment, User } from '../../../core/models';
import { DEMO_COURSES, DEMO_PAYMENTS, DEMO_USERS } from '../../../core/demo-data';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule, TranslatePipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboardComponent implements OnInit {
  readonly auth = inject(AuthStore);
  readonly courses = inject(CoursesStore);
  private readonly usersApi = inject(UsersApiService);
  private readonly paymentsApi = inject(PaymentsApiService);

  readonly users = signal<User[]>([]);
  readonly payments = signal<Payment[]>([]);

  ngOnInit(): void {
    this.courses.load();
    this.usersApi
      .list()
      .pipe(catchError(() => of(DEMO_USERS)))
      .subscribe((rows) => this.users.set(rows));
    this.paymentsApi
      .list()
      .pipe(catchError(() => of(DEMO_PAYMENTS)))
      .subscribe((rows) => this.payments.set(rows));
    setTimeout(() => {
      if (!this.courses.courses().length) this.courses.setCourses(DEMO_COURSES);
    }, 800);
  }
}
