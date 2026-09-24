import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';
import { PaymentsApiService } from '../../core/api/payments-api.service';
import { Payment } from '../../core/models';
import { DEMO_PAYMENTS } from '../../core/demo-data';

@Component({
  selector: 'app-payments-page',
  imports: [CurrencyPipe, DatePipe, MatTableModule, TranslatePipe],
  templateUrl: './payments-page.html',
  styleUrl: './payments-page.scss',
})
export class PaymentsPageComponent implements OnInit {
  private readonly api = inject(PaymentsApiService);
  readonly rows = signal<Payment[]>([]);
  readonly displayedColumns = ['student', 'amount', 'method', 'status', 'date'];

  ngOnInit(): void {
    this.api
      .list()
      .pipe(catchError(() => of(DEMO_PAYMENTS)))
      .subscribe((rows) => this.rows.set(rows));
  }
}
