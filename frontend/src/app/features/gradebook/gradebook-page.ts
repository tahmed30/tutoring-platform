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
import { GradebookStore } from '../../state/gradebook.store';
import { DEMO_GRADES } from '../../core/demo-data';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-gradebook-page',
  imports: [MatButtonModule, TranslatePipe, AgGridAngular],
  templateUrl: './gradebook-page.html',
  styleUrl: './gradebook-page.scss',
})
export class GradebookPageComponent implements OnInit {
  readonly store = inject(GradebookStore);
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
      if (!this.store.grades().length) this.store.setGrades(DEMO_GRADES);
    }, 800);
  }

  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
  }

  onCellValueChanged(event: CellValueChangedEvent): void {
    if (event.colDef.field === 'gradeValue' && event.data?.id) {
      this.store.updateGrade(event.data.id, Number(event.newValue));
    }
  }

  exportCsv(): void {
    this.gridApi?.exportDataAsCsv({ fileName: 'gradebook.csv' });
  }

  private buildColumns(): void {
    this.columnDefs = [
      {
        headerName: this.translate.instant('gradebook.colCourse'),
        valueGetter: (p) => p.data?.course?.title ?? p.data?.courseId,
        sort: 'asc',
      },
      {
        headerName: this.translate.instant('gradebook.colStudent'),
        valueGetter: (p) =>
          p.data?.student ? `${p.data.student.firstName} ${p.data.student.lastName}` : '',
      },
      {
        headerName: this.translate.instant('gradebook.colAssignment'),
        valueGetter: (p) => p.data?.assignment?.title ?? '',
      },
      {
        field: 'gradeValue',
        headerName: this.translate.instant('gradebook.colGrade'),
        editable: true,
      },
      {
        field: 'gradeType',
        headerName: this.translate.instant('gradebook.colType'),
      },
      {
        field: 'dateRecorded',
        headerName: this.translate.instant('gradebook.colDate'),
        valueFormatter: (p) => (p.value ? String(p.value).slice(0, 10) : ''),
      },
    ];
  }
}
