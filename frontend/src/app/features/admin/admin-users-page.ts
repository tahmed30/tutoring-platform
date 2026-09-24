import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';
import { UsersApiService } from '../../core/api/users-api.service';
import { User } from '../../core/models';
import { DEMO_USERS } from '../../core/demo-data';

@Component({
  selector: 'app-admin-users-page',
  imports: [MatTableModule, TranslatePipe],
  templateUrl: './admin-users-page.html',
  styleUrl: './admin-users-page.scss',
})
export class AdminUsersPageComponent implements OnInit {
  private readonly api = inject(UsersApiService);
  readonly rows = signal<User[]>([]);
  readonly displayedColumns = ['name', 'email', 'role', 'language'];

  ngOnInit(): void {
    this.api
      .list()
      .pipe(catchError(() => of(DEMO_USERS)))
      .subscribe((rows) => this.rows.set(rows));
  }
}
