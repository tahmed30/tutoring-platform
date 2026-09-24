import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing-page').then((m) => m.LandingPageComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login-page').then((m) => m.LoginPageComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register-page').then((m) => m.RegisterPageComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell-layout').then((m) => m.ShellLayoutComponent),
    children: [
      {
        path: 'dashboard',
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./features/dashboard/dashboard-redirect').then(
                (m) => m.DashboardRedirectComponent,
              ),
          },
          {
            path: 'student',
            canActivate: [roleGuard],
            data: { roles: ['STUDENT'] },
            loadComponent: () =>
              import('./features/dashboard/student/student-dashboard').then(
                (m) => m.StudentDashboardComponent,
              ),
          },
          {
            path: 'parent',
            canActivate: [roleGuard],
            data: { roles: ['PARENT'] },
            loadComponent: () =>
              import('./features/dashboard/parent/parent-dashboard').then(
                (m) => m.ParentDashboardComponent,
              ),
          },
          {
            path: 'teacher',
            canActivate: [roleGuard],
            data: { roles: ['TEACHER'] },
            loadComponent: () =>
              import('./features/dashboard/teacher/teacher-dashboard').then(
                (m) => m.TeacherDashboardComponent,
              ),
          },
          {
            path: 'admin',
            canActivate: [roleGuard],
            data: { roles: ['ADMIN'] },
            loadComponent: () =>
              import('./features/dashboard/admin/admin-dashboard').then(
                (m) => m.AdminDashboardComponent,
              ),
          },
        ],
      },
      {
        path: 'courses',
        loadComponent: () =>
          import('./features/courses/courses-page').then((m) => m.CoursesPageComponent),
      },
      {
        path: 'attendance',
        loadComponent: () =>
          import('./features/attendance/attendance-page').then((m) => m.AttendancePageComponent),
      },
      {
        path: 'gradebook',
        loadComponent: () =>
          import('./features/gradebook/gradebook-page').then((m) => m.GradebookPageComponent),
      },
      {
        path: 'assignments',
        loadComponent: () =>
          import('./features/assignments/assignments-page').then((m) => m.AssignmentsPageComponent),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./features/messages/messages-page').then((m) => m.MessagesPageComponent),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications-page').then(
            (m) => m.NotificationsPageComponent,
          ),
      },
      {
        path: 'payments',
        canActivate: [roleGuard],
        data: { roles: ['PARENT', 'ADMIN'] },
        loadComponent: () =>
          import('./features/payments/payments-page').then((m) => m.PaymentsPageComponent),
      },
      {
        path: 'admin/users',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/admin/admin-users-page').then((m) => m.AdminUsersPageComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
