import { Injectable } from '@nestjs/common';
import { AccessHelper } from '../common/helpers/access.helper';
import { AuditLogHelper } from '../common/helpers/audit-log.helper';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGradeDto } from './dto/grade.dto';

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessHelper,
    private readonly audit: AuditLogHelper,
  ) {}

  async create(dto: CreateGradeDto, actor: AuthUser) {
    await this.access.assertCourseTeacherOrAdmin(actor, dto.courseId);

    const grade = await this.prisma.grade.create({
      data: {
        courseId: dto.courseId,
        studentId: dto.studentId,
        assignmentId: dto.assignmentId,
        gradeValue: dto.gradeValue,
        gradeType: dto.gradeType,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'GRADE_CREATE',
      entityType: 'Grade',
      entityId: grade.id,
    });

    return grade;
  }

  async byStudent(studentId: string, actor: AuthUser) {
    await this.access.assertCanAccessStudent(actor, studentId);
    return this.prisma.grade.findMany({
      where: { studentId },
      include: {
        course: { select: { id: true, title: true } },
        assignment: { select: { id: true, title: true } },
      },
      orderBy: { dateRecorded: 'desc' },
    });
  }

  async byCourse(courseId: string, actor: AuthUser) {
    await this.access.assertCourseTeacherOrAdmin(actor, courseId);
    return this.prisma.grade.findMany({
      where: { courseId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
        assignment: { select: { id: true, title: true } },
      },
      orderBy: { dateRecorded: 'desc' },
    });
  }
}
