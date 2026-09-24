import { PreferredLanguage, RoleName } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function upsertUser(params: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roleId: string;
  phone?: string;
}) {
  const passwordHash = await bcrypt.hash(params.password, 12);
  return prisma.user.upsert({
    where: { email: params.email },
    update: {
      firstName: params.firstName,
      lastName: params.lastName,
      passwordHash,
      roleId: params.roleId,
      phone: params.phone,
    },
    create: {
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      passwordHash,
      roleId: params.roleId,
      phone: params.phone,
      preferredLanguage: PreferredLanguage.EN,
    },
  });
}

async function main() {
  const roleNames = [
    RoleName.STUDENT,
    RoleName.PARENT,
    RoleName.TEACHER,
    RoleName.ADMIN,
  ];

  const roles = {} as Record<RoleName, { id: string; name: RoleName }>;
  for (const name of roleNames) {
    roles[name] = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const subjectNames = [
    { name: 'Amharic', description: 'Amharic language instruction' },
    { name: 'Math', description: 'Mathematics' },
    { name: 'AI', description: 'Artificial Intelligence fundamentals' },
    { name: 'English', description: 'English language arts' },
    {
      name: 'Computer Science',
      description: 'Programming and computer science',
    },
  ];

  const subjects = [];
  for (const subject of subjectNames) {
    subjects.push(
      await prisma.subject.upsert({
        where: { name: subject.name },
        update: { description: subject.description },
        create: subject,
      }),
    );
  }

  const admin = await upsertUser({
    email: 'admin@tutoring.local',
    firstName: 'Ada',
    lastName: 'Admin',
    password: 'Teacher123!',
    roleId: roles.ADMIN.id,
  });

  const teacher = await upsertUser({
    email: 'teacher@tutoring.local',
    firstName: 'Tigist',
    lastName: 'Teacher',
    password: 'Password123!',
    roleId: roles.TEACHER.id,
    phone: '+1-555-0101',
  });

  const student = await upsertUser({
    email: 'student@tutoring.local',
    firstName: 'Sam',
    lastName: 'Student',
    password: 'Password123!',
    roleId: roles.STUDENT.id,
    phone: '+1-555-0102',
  });

  const parent = await upsertUser({
    email: 'parent@tutoring.local',
    firstName: 'Pat',
    lastName: 'Parent',
    password: 'Password123!',
    roleId: roles.PARENT.id,
    phone: '+1-555-0103',
  });

  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: { parentId: parent.id, studentId: student.id },
    },
    update: {},
    create: { parentId: parent.id, studentId: student.id },
  });

  const math = subjects.find((s) => s.name === 'Math')!;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 4);

  let course = await prisma.course.findFirst({
    where: { title: 'Intro to Algebra', teacherId: teacher.id },
  });

  if (!course) {
    course = await prisma.course.create({
      data: {
        subjectId: math.id,
        teacherId: teacher.id,
        title: 'Intro to Algebra',
        description: 'Foundational algebra for middle school students',
        gradeLevel: 'Grade 7',
        startDate,
        endDate,
      },
    });
  }

  await prisma.courseEnrollment.upsert({
    where: {
      courseId_studentId: { courseId: course.id, studentId: student.id },
    },
    update: {},
    create: { courseId: course.id, studentId: student.id },
  });

  const existingAssignment = await prisma.assignment.findFirst({
    where: { courseId: course.id, title: 'Week 1 Homework' },
  });

  if (!existingAssignment) {
    await prisma.assignment.create({
      data: {
        courseId: course.id,
        title: 'Week 1 Homework',
        description: 'Complete exercises 1–10 in chapter 1',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxScore: 100,
      },
    });
  }

  const existingSchedule = await prisma.classSchedule.findFirst({
    where: { courseId: course.id, dayOfWeek: 'MON', startTime: '16:00' },
  });
  if (!existingSchedule) {
    await prisma.classSchedule.create({
      data: {
        courseId: course.id,
        teacherId: teacher.id,
        dayOfWeek: 'MON',
        startTime: '16:00',
        endTime: '17:00',
        location: 'Room A1',
      },
    });
  }

  console.log('Seed complete');
  console.log({
    admin: admin.email,
    teacher: teacher.email,
    student: student.email,
    parent: parent.email,
    course: course.title,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
