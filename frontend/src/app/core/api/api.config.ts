import { environment } from '../../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl;

export const API_PATHS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  users: '/users',
  subjects: '/subjects',
  courses: '/courses',
  enrollments: '/enrollments',
  attendance: '/attendance',
  schedules: '/schedules',
  assignments: '/assignments',
  submissions: '/submissions',
  grades: '/grades',
  messages: '/messages',
  notifications: '/notifications',
  payments: '/payments',
  admin: {
    users: '/admin/users',
    roles: '/admin/roles',
    settings: '/admin/settings',
  },
  parents: {
    children: '/parents/children',
  },
} as const;
