import { Component, OnInit, inject } from '@angular/core';
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
import { AttendanceStore } from '../../state/attendance.store';
import { AttendanceStatus } from '../../core/models';
import { DEMO_ATTENDANCE } from '../../core/demo-data';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-attendance-page',
  imports: [MatButtonModule, TranslatePipe, AgGridAngular],
  templateUrl: './attendance-page.html',
  styleUrl: './attendance-page.scss',
})
export class AttendancePageComponent implements OnInit {
  readonly store = inject(AttendanceStore);
  private readonly translate = inject(TranslateService);
  private gridApi?: GridApi;

  columnDefs: ColDef[] = [];
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 110,
  };

  ngOnInit(): void {
    this.buildColumns();
    this.store.load();
    setTimeout(() => {
      if (!this.store.records().length) this.store.setRecords(DEMO_ATTENDANCE);
    }, 800);
  }

  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
  }

  onCellValueChanged(event: CellValueChangedEvent): void {
    if (event.colDef.field === 'status' && event.data?.id) {
      this.store.updateStatus(event.data.id, event.newValue as AttendanceStatus);
    }
  }

  exportCsv(): void {
    this.gridApi?.exportDataAsCsv({ fileName: 'attendance.csv' });
  }

  private buildColumns(): void {
    this.columnDefs = [
      {
        headerName: this.translate.instant('attendance.colStudent'),
        valueGetter: (p) =>
          p.data?.student ? `${p.data.student.firstName} ${p.data.student.lastName}` : '',
      },
      {
        headerName: this.translate.instant('attendance.colCourse'),
        valueGetter: (p) => p.data?.course?.title ?? '',
      },
      {
        field: 'date',
        headerName: this.translate.instant('attendance.colDate'),
        valueFormatter: (p) => (p.value ? String(p.value).slice(0, 10) : ''),
      },
      {
        field: 'status',
        headerName: this.translate.instant('attendance.colStatus'),
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: ['PRESENT', 'ABSENT', 'LATE'] },
      },
      {
        field: 'notes',
        headerName: this.translate.instant('attendance.colNotes'),
        editable: true,
      },
    ];
  }
}
