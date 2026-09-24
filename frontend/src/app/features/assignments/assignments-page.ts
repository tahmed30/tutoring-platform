import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  CellValueChangedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
} from 'ag-grid-community';
import { catchError, of } from 'rxjs';
import { AssignmentsApiService } from '../../core/api/assignments-api.service';
import { AssignmentSubmission } from '../../core/models';
import { DEMO_SUBMISSIONS } from '../../core/demo-data';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-assignments-page',
  imports: [MatButtonModule, TranslatePipe, AgGridAngular],
  templateUrl: './assignments-page.html',
  styleUrl: './assignments-page.scss',
})
export class AssignmentsPageComponent implements OnInit {
  private readonly api = inject(AssignmentsApiService);
  private readonly translate = inject(TranslateService);
  private gridApi?: GridApi;

  readonly rows = signal<AssignmentSubmission[]>([]);
  columnDefs: ColDef[] = [];
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 120,
  };

  ngOnInit(): void {
    this.buildColumns();
    this.api
      .listSubmissions()
      .pipe(catchError(() => of(DEMO_SUBMISSIONS)))
      .subscribe((rows) => this.rows.set(rows));
  }

  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
  }

  onCellValueChanged(event: CellValueChangedEvent): void {
    const id = event.data?.id as string | undefined;
    if (!id) return;
    if (event.colDef.field === 'grade' || event.colDef.field === 'teacherFeedback') {
      this.api
        .gradeSubmission(id, {
          grade: Number(event.data.grade ?? 0),
          teacherFeedback: event.data.teacherFeedback ?? undefined,
        })
        .subscribe();
    }
  }

  exportCsv(): void {
    this.gridApi?.exportDataAsCsv({ fileName: 'submissions.csv' });
  }

  private buildColumns(): void {
    this.columnDefs = [
      {
        headerName: this.translate.instant('assignments.colStudent'),
        valueGetter: (p) =>
          p.data?.student ? `${p.data.student.firstName} ${p.data.student.lastName}` : '',
      },
      {
        headerName: this.translate.instant('assignments.colAssignment'),
        valueGetter: (p) => p.data?.assignment?.title ?? '',
      },
      {
        field: 'submittedAt',
        headerName: this.translate.instant('assignments.colSubmittedAt'),
        valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleString() : ''),
      },
      {
        field: 'grade',
        headerName: this.translate.instant('assignments.colGrade'),
        editable: true,
      },
      {
        field: 'teacherFeedback',
        headerName: this.translate.instant('assignments.colFeedback'),
        editable: true,
      },
    ];
  }
}
