import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
} from 'ag-grid-community';
import { CoursesStore } from '../../state/courses.store';
import { DEMO_COURSES } from '../../core/demo-data';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-courses-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
    AgGridAngular,
  ],
  templateUrl: './courses-page.html',
  styleUrl: './courses-page.scss',
})
export class CoursesPageComponent implements OnInit {
  readonly store = inject(CoursesStore);
  private readonly translate = inject(TranslateService);
  private gridApi?: GridApi;

  subject = '';
  teacher = '';
  gradeLevel = '';
  search = '';

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
    this.store.load();
    setTimeout(() => {
      if (!this.store.courses().length) this.store.setCourses(DEMO_COURSES);
    }, 800);
  }

  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
  }

  applyFilters(): void {
    this.store.setSubjectFilter(this.subject);
    this.store.setTeacherFilter(this.teacher);
    this.store.setGradeFilter(this.gradeLevel);
    this.store.setSearchFilter(this.search);
  }

  clearFilters(): void {
    this.subject = '';
    this.teacher = '';
    this.gradeLevel = '';
    this.search = '';
    this.store.clearFilters();
  }

  private buildColumns(): void {
    this.columnDefs = [
      { field: 'title', headerName: this.translate.instant('courses.colTitle') },
      {
        headerName: this.translate.instant('courses.colSubject'),
        valueGetter: (p) => p.data?.subject?.name ?? '',
      },
      {
        headerName: this.translate.instant('courses.colTeacher'),
        valueGetter: (p) =>
          p.data?.teacher ? `${p.data.teacher.firstName} ${p.data.teacher.lastName}` : '',
      },
      { field: 'gradeLevel', headerName: this.translate.instant('courses.colGradeLevel') },
      {
        field: 'startDate',
        headerName: this.translate.instant('courses.colStart'),
        valueFormatter: (p) => (p.value ? String(p.value).slice(0, 10) : ''),
      },
      {
        field: 'endDate',
        headerName: this.translate.instant('courses.colEnd'),
        valueFormatter: (p) => (p.value ? String(p.value).slice(0, 10) : ''),
      },
    ];
  }
}
