import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { AccessHelper } from '../common/helpers/access.helper';
import { AuditLogHelper } from '../common/helpers/audit-log.helper';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { MarkAttendanceDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessHelper,
    private readonly audit: AuditLogHelper,
  ) {}

  async mark(dto: MarkAttendanceDto, actor: AuthUser) {
    await this.access.assertCourseTeacherOrAdmin(actor, dto.courseId);

    const date = new Date(dto.date);
    const record = await this.prisma.attendance.upsert({
      where: {
        courseId_studentId_date: {
          courseId: dto.courseId,
          studentId: dto.studentId,
          date,
        },
      },
      create: {
        courseId: dto.courseId,
        studentId: dto.studentId,
        date,
        status: dto.status,
        notes: dto.notes,
      },
      update: {
        status: dto.status,
        notes: dto.notes,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'ATTENDANCE_MARK',
      entityType: 'Attendance',
      entityId: record.id,
    });

    return record;
  }

  async byStudent(studentId: string, actor: AuthUser) {
    await this.access.assertCanAccessStudent(actor, studentId);
    return this.prisma.attendance.findMany({
      where: { studentId },
      include: {
        course: { select: { id: true, title: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async byCourse(courseId: string, actor: AuthUser) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    if (
      actor.role !== RoleName.ADMIN &&
      course.teacherId !== actor.id &&
      actor.role !== RoleName.STUDENT &&
      actor.role !== RoleName.PARENT
    ) {
      await this.access.assertCourseTeacherOrAdmin(actor, courseId);
    }

    if (actor.role === RoleName.STUDENT) {
      return this.prisma.attendance.findMany({
        where: { courseId, studentId: actor.id },
        orderBy: { date: 'desc' },
      });
    }

    if (actor.role === RoleName.PARENT) {
      const studentIds = await this.access.getLinkedStudentIds(actor.id);
      return this.prisma.attendance.findMany({
        where: { courseId, studentId: { in: studentIds } },
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { date: 'desc' },
      });
    }

    return this.prisma.attendance.findMany({
      where: { courseId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }
}
