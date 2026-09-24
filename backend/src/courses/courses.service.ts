import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { AccessHelper } from '../common/helpers/access.helper';
import { AuditLogHelper } from '../common/helpers/audit-log.helper';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';

const courseInclude = {
  subject: true,
  teacher: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  _count: { select: { enrollments: true } },
} as const;

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessHelper,
    private readonly audit: AuditLogHelper,
  ) {}

  async create(dto: CreateCourseDto, actor: AuthUser) {
    if (actor.role === RoleName.TEACHER) {
      dto.teacherId = actor.id;
    } else if (!dto.teacherId) {
      throw new ForbiddenException('teacherId is required');
    }

    if (actor.role === RoleName.ADMIN && dto.teacherId) {
      const teacher = await this.prisma.user.findUnique({
        where: { id: dto.teacherId },
        include: { role: true },
      });
      if (!teacher || teacher.role.name !== RoleName.TEACHER) {
        throw new NotFoundException('Teacher not found');
      }
    }

    const course = await this.prisma.course.create({
      data: {
        subjectId: dto.subjectId,
        teacherId: dto.teacherId!,
        title: dto.title,
        description: dto.description,
        gradeLevel: dto.gradeLevel,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
      include: courseInclude,
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'COURSE_CREATE',
      entityType: 'Course',
      entityId: course.id,
    });

    return course;
  }

  async findAll(actor: AuthUser) {
    if (actor.role === RoleName.ADMIN) {
      return this.prisma.course.findMany({
        include: courseInclude,
        orderBy: { startDate: 'desc' },
      });
    }

    if (actor.role === RoleName.TEACHER) {
      return this.prisma.course.findMany({
        where: { teacherId: actor.id },
        include: courseInclude,
        orderBy: { startDate: 'desc' },
      });
    }

    if (actor.role === RoleName.STUDENT) {
      return this.prisma.course.findMany({
        where: { enrollments: { some: { studentId: actor.id } } },
        include: courseInclude,
        orderBy: { startDate: 'desc' },
      });
    }

    const studentIds = await this.access.getLinkedStudentIds(actor.id);
    return this.prisma.course.findMany({
      where: {
        enrollments: { some: { studentId: { in: studentIds } } },
      },
      include: courseInclude,
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string, actor: AuthUser) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        ...courseInclude,
        schedules: true,
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found');

    if (actor.role === RoleName.ADMIN || course.teacherId === actor.id) {
      return course;
    }

    if (actor.role === RoleName.STUDENT) {
      const enrolled = course.enrollments.some((e) => e.studentId === actor.id);
      if (!enrolled) throw new ForbiddenException('Not enrolled in this course');
      return course;
    }

    if (actor.role === RoleName.PARENT) {
      const studentIds = await this.access.getLinkedStudentIds(actor.id);
      const linked = course.enrollments.some((e) =>
        studentIds.includes(e.studentId),
      );
      if (!linked) throw new ForbiddenException('No linked students in course');
      return course;
    }

    throw new ForbiddenException('Not allowed to view this course');
  }

  async update(id: string, dto: UpdateCourseDto, actor: AuthUser) {
    await this.access.assertCourseTeacherOrAdmin(actor, id);

    const course = await this.prisma.course.update({
      where: { id },
      data: {
        subjectId: dto.subjectId,
        teacherId: actor.role === RoleName.ADMIN ? dto.teacherId : undefined,
        title: dto.title,
        description: dto.description,
        gradeLevel: dto.gradeLevel,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: courseInclude,
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'COURSE_UPDATE',
      entityType: 'Course',
      entityId: id,
    });

    return course;
  }

  async remove(id: string, actor: AuthUser) {
    await this.access.assertCourseTeacherOrAdmin(actor, id);
    await this.prisma.course.delete({ where: { id } });
    await this.audit.log({
      actorId: actor.id,
      action: 'COURSE_DELETE',
      entityType: 'Course',
      entityId: id,
    });
    return { success: true };
  }

  async enroll(courseId: string, studentId: string, actor: AuthUser) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    if (actor.role === RoleName.STUDENT) {
      studentId = actor.id;
    } else if (
      actor.role !== RoleName.ADMIN &&
      actor.role !== RoleName.TEACHER
    ) {
      throw new ForbiddenException('Not allowed to enroll students');
    } else if (actor.role === RoleName.TEACHER && course.teacherId !== actor.id) {
      throw new ForbiddenException('Not your course');
    }

    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { role: true },
    });
    if (!student || student.role.name !== RoleName.STUDENT) {
      throw new NotFoundException('Student not found');
    }

    try {
      const enrollment = await this.prisma.courseEnrollment.create({
        data: { courseId, studentId },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      await this.audit.log({
        actorId: actor.id,
        action: 'COURSE_ENROLL',
        entityType: 'CourseEnrollment',
        entityId: enrollment.id,
      });

      return enrollment;
    } catch {
      throw new ConflictException('Student already enrolled');
    }
  }

  async listEnrollments(courseId: string, actor: AuthUser) {
    await this.findOne(courseId, actor);
    return this.prisma.courseEnrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { enrollmentDate: 'desc' },
    });
  }

  async unenroll(courseId: string, studentId: string, actor: AuthUser) {
    await this.access.assertCourseTeacherOrAdmin(actor, courseId);
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    await this.prisma.courseEnrollment.delete({ where: { id: enrollment.id } });
    return { success: true };
  }
}
