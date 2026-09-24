export type RoleName = 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN';
export type PreferredLanguage = 'EN' | 'AM';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';
export type GradeType = 'EXAM' | 'QUIZ' | 'HOMEWORK' | 'PROJECT' | 'FINAL';
export type NotificationType =
  | 'INFO'
  | 'WARNING'
  | 'GRADE_UPDATE'
  | 'ATTENDANCE_ALERT'
  | 'PAYMENT_REMINDER';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type AppLanguage = 'en' | 'am';
export type AppTheme = 'light' | 'dark';

export interface Role {
  id: string;
  name: RoleName;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  preferredLanguage: PreferredLanguage;
  roleId: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: RoleName;
  preferredLanguage?: PreferredLanguage;
}

export interface Subject {
  id: string;
  name: string;
  description?: string | null;
}

export interface Course {
  id: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description?: string | null;
  gradeLevel: string;
  startDate: string;
  endDate: string;
  subject?: Subject;
  teacher?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  studentId: string;
  enrollmentDate: string;
  course?: Course;
  student?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
}

export interface AttendanceRecord {
  id: string;
  courseId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  notes?: string | null;
  course?: Pick<Course, 'id' | 'title'>;
  student?: Pick<User, 'id' | 'firstName' | 'lastName'>;
}

export interface ClassSchedule {
  id: string;
  courseId: string;
  teacherId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  location: string;
  course?: Pick<Course, 'id' | 'title'>;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  dueDate: string;
  maxScore: number;
  course?: Pick<Course, 'id' | 'title'>;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  submissionFileUrl?: string | null;
  submittedAt: string;
  grade?: number | null;
  teacherFeedback?: string | null;
  gradedById?: string | null;
  assignment?: Pick<Assignment, 'id' | 'title' | 'maxScore' | 'courseId'>;
  student?: Pick<User, 'id' | 'firstName' | 'lastName'>;
}

export interface GradeRecord {
  id: string;
  courseId: string;
  studentId: string;
  assignmentId?: string | null;
  gradeValue: number;
  gradeType: GradeType;
  dateRecorded: string;
  course?: Pick<Course, 'id' | 'title'>;
  student?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  assignment?: Pick<Assignment, 'id' | 'title'> | null;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  messageBody: string;
  sentAt: string;
  readAt?: string | null;
  sender?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  receiver?: Pick<User, 'id' | 'firstName' | 'lastName'>;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  createdAt: string;
  readStatus: boolean;
}

export interface Payment {
  id: string;
  parentId: string;
  studentId: string;
  amount: number | string;
  currency: string;
  paymentMethod: string;
  paymentDate: string;
  status: PaymentStatus;
  referenceId?: string | null;
  parent?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  student?: Pick<User, 'id' | 'firstName' | 'lastName'>;
}

export interface ParentStudentLink {
  id: string;
  parentId: string;
  studentId: string;
  student?: User;
  parent?: User;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page?: number;
  pageSize?: number;
}
