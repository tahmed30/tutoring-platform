import {
  AssignmentSubmission,
  AttendanceRecord,
  Course,
  GradeRecord,
  Message,
  Notification,
  Payment,
  User,
} from '../core/models';

const teacher = {
  id: 't1',
  firstName: 'Sara',
  lastName: 'Bekele',
  email: 'sara@example.com',
};

export const DEMO_COURSES: Course[] = [
  {
    id: 'c1',
    subjectId: 's1',
    teacherId: 't1',
    title: 'Algebra Foundations',
    gradeLevel: 'Grade 8',
    startDate: '2026-01-10',
    endDate: '2026-06-15',
    subject: { id: 's1', name: 'Mathematics' },
    teacher,
  },
  {
    id: 'c2',
    subjectId: 's2',
    teacherId: 't1',
    title: 'English Writing Lab',
    gradeLevel: 'Grade 9',
    startDate: '2026-01-12',
    endDate: '2026-06-20',
    subject: { id: 's2', name: 'English' },
    teacher,
  },
  {
    id: 'c3',
    subjectId: 's3',
    teacherId: 't1',
    title: 'Biology Essentials',
    gradeLevel: 'Grade 10',
    startDate: '2026-02-01',
    endDate: '2026-07-01',
    subject: { id: 's3', name: 'Science' },
    teacher,
  },
];

export const DEMO_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'a1',
    courseId: 'c1',
    studentId: 'st1',
    date: '2026-03-01',
    status: 'PRESENT',
    notes: '',
    student: { id: 'st1', firstName: 'Abel', lastName: 'Tadesse' },
    course: { id: 'c1', title: 'Algebra Foundations' },
  },
  {
    id: 'a2',
    courseId: 'c1',
    studentId: 'st2',
    date: '2026-03-01',
    status: 'LATE',
    notes: 'Arrived 10 min late',
    student: { id: 'st2', firstName: 'Hanna', lastName: 'Mekonnen' },
    course: { id: 'c1', title: 'Algebra Foundations' },
  },
  {
    id: 'a3',
    courseId: 'c2',
    studentId: 'st1',
    date: '2026-03-02',
    status: 'ABSENT',
    notes: 'Illness',
    student: { id: 'st1', firstName: 'Abel', lastName: 'Tadesse' },
    course: { id: 'c2', title: 'English Writing Lab' },
  },
];

export const DEMO_GRADES: GradeRecord[] = [
  {
    id: 'g1',
    courseId: 'c1',
    studentId: 'st1',
    assignmentId: 'as1',
    gradeValue: 88,
    gradeType: 'QUIZ',
    dateRecorded: '2026-02-20',
    student: { id: 'st1', firstName: 'Abel', lastName: 'Tadesse' },
    assignment: { id: 'as1', title: 'Linear equations quiz' },
    course: { id: 'c1', title: 'Algebra Foundations' },
  },
  {
    id: 'g2',
    courseId: 'c1',
    studentId: 'st2',
    assignmentId: 'as1',
    gradeValue: 92,
    gradeType: 'QUIZ',
    dateRecorded: '2026-02-20',
    student: { id: 'st2', firstName: 'Hanna', lastName: 'Mekonnen' },
    assignment: { id: 'as1', title: 'Linear equations quiz' },
    course: { id: 'c1', title: 'Algebra Foundations' },
  },
  {
    id: 'g3',
    courseId: 'c2',
    studentId: 'st1',
    assignmentId: 'as2',
    gradeValue: 85,
    gradeType: 'HOMEWORK',
    dateRecorded: '2026-02-25',
    student: { id: 'st1', firstName: 'Abel', lastName: 'Tadesse' },
    assignment: { id: 'as2', title: 'Essay draft' },
    course: { id: 'c2', title: 'English Writing Lab' },
  },
];

export const DEMO_SUBMISSIONS: AssignmentSubmission[] = [
  {
    id: 'sub1',
    assignmentId: 'as1',
    studentId: 'st1',
    submittedAt: '2026-02-19T18:00:00Z',
    grade: 88,
    teacherFeedback: 'Strong work',
    assignment: { id: 'as1', title: 'Linear equations quiz', maxScore: 100, courseId: 'c1' },
    student: { id: 'st1', firstName: 'Abel', lastName: 'Tadesse' },
  },
  {
    id: 'sub2',
    assignmentId: 'as2',
    studentId: 'st2',
    submittedAt: '2026-02-24T20:15:00Z',
    grade: null,
    teacherFeedback: null,
    assignment: { id: 'as2', title: 'Essay draft', maxScore: 100, courseId: 'c2' },
    student: { id: 'st2', firstName: 'Hanna', lastName: 'Mekonnen' },
  },
];

export const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    userId: 'u1',
    type: 'GRADE_UPDATE',
    message: 'New quiz grade posted for Algebra Foundations.',
    createdAt: '2026-03-01T10:00:00Z',
    readStatus: false,
  },
  {
    id: 'n2',
    userId: 'u1',
    type: 'PAYMENT_REMINDER',
    message: 'March tuition payment is due in 3 days.',
    createdAt: '2026-03-02T09:00:00Z',
    readStatus: true,
  },
];

export const DEMO_MESSAGES: Message[] = [
  {
    id: 'm1',
    senderId: 't1',
    receiverId: 'u1',
    messageBody: 'Please review this week’s homework checklist.',
    sentAt: '2026-03-01T14:00:00Z',
    readAt: null,
    sender: teacher,
  },
];

export const DEMO_PAYMENTS: Payment[] = [
  {
    id: 'p1',
    parentId: 'par1',
    studentId: 'st1',
    amount: 120,
    currency: 'USD',
    paymentMethod: 'card',
    paymentDate: '2026-02-01',
    status: 'COMPLETED',
    student: { id: 'st1', firstName: 'Abel', lastName: 'Tadesse' },
  },
  {
    id: 'p2',
    parentId: 'par1',
    studentId: 'st1',
    amount: 120,
    currency: 'USD',
    paymentMethod: 'card',
    paymentDate: '2026-03-01',
    status: 'PENDING',
    student: { id: 'st1', firstName: 'Abel', lastName: 'Tadesse' },
  },
];

export const DEMO_USERS: User[] = [
  {
    id: 'u1',
    firstName: 'Abel',
    lastName: 'Tadesse',
    email: 'abel@example.com',
    preferredLanguage: 'EN',
    roleId: 'r1',
    role: { id: 'r1', name: 'STUDENT' },
  },
  {
    id: 'u2',
    firstName: 'Marta',
    lastName: 'Tadesse',
    email: 'marta@example.com',
    preferredLanguage: 'AM',
    roleId: 'r2',
    role: { id: 'r2', name: 'PARENT' },
  },
  {
    id: 'u3',
    firstName: 'Sara',
    lastName: 'Bekele',
    email: 'sara@example.com',
    preferredLanguage: 'EN',
    roleId: 'r3',
    role: { id: 'r3', name: 'TEACHER' },
  },
];
