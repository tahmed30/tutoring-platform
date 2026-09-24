import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import { CoursesApiService } from '../core/api/courses-api.service';
import { Course, Paginated } from '../core/models';

function unwrapList<T>(response: T[] | Paginated<T>): T[] {
  return Array.isArray(response) ? response : response.data;
}

@Injectable({ providedIn: 'root' })
export class CoursesStore {
  private readonly api = inject(CoursesApiService);

  private readonly coursesSignal = signal<Course[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly subjectFilter = signal('');
  private readonly teacherFilter = signal('');
  private readonly gradeFilter = signal('');
  private readonly searchFilter = signal('');

  readonly courses = this.coursesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly filters = computed(() => ({
    subject: this.subjectFilter(),
    teacher: this.teacherFilter(),
    gradeLevel: this.gradeFilter(),
    search: this.searchFilter(),
  }));

  readonly filteredCourses = computed(() => {
    const subject = this.subjectFilter().toLowerCase().trim();
    const teacher = this.teacherFilter().toLowerCase().trim();
    const grade = this.gradeFilter().toLowerCase().trim();
    const search = this.searchFilter().toLowerCase().trim();

    return this.coursesSignal().filter((course) => {
      const subjectName = course.subject?.name?.toLowerCase() ?? '';
      const teacherName = course.teacher
        ? `${course.teacher.firstName} ${course.teacher.lastName}`.toLowerCase()
        : '';
      const matchesSubject = !subject || subjectName.includes(subject);
      const matchesTeacher = !teacher || teacherName.includes(teacher);
      const matchesGrade = !grade || course.gradeLevel.toLowerCase().includes(grade);
      const matchesSearch =
        !search ||
        course.title.toLowerCase().includes(search) ||
        subjectName.includes(search) ||
        teacherName.includes(search);
      return matchesSubject && matchesTeacher && matchesGrade && matchesSearch;
    });
  });

  load(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api
      .list()
      .pipe(
        tap((response) => this.coursesSignal.set(unwrapList(response))),
        catchError((err) => {
          this.errorSignal.set(err?.message ?? 'Failed to load courses');
          this.coursesSignal.set([]);
          return of([]);
        }),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe();
  }

  setCourses(courses: Course[]): void {
    this.coursesSignal.set(courses);
  }

  setSubjectFilter(value: string): void {
    this.subjectFilter.set(value);
  }

  setTeacherFilter(value: string): void {
    this.teacherFilter.set(value);
  }

  setGradeFilter(value: string): void {
    this.gradeFilter.set(value);
  }

  setSearchFilter(value: string): void {
    this.searchFilter.set(value);
  }

  clearFilters(): void {
    this.subjectFilter.set('');
    this.teacherFilter.set('');
    this.gradeFilter.set('');
    this.searchFilter.set('');
  }
}
