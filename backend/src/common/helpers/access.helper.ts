import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { AuthUser } from '../types/auth-user';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccessHelper {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanAccessStudent(actor: AuthUser, studentId: string) {
    if (actor.role === RoleName.ADMIN || actor.id === studentId) {
      return;
    }

    if (actor.role === RoleName.PARENT) {
      const link = await this.prisma.parentStudent.findUnique({
        where: {
          parentId_studentId: { parentId: actor.id, studentId },
        },
      });
      if (link) return;
    }

    if (actor.role === RoleName.TEACHER) {
      const shared = await this.prisma.courseEnrollment.findFirst({
        where: {
          studentId,
          course: { teacherId: actor.id },
        },
      });
      if (shared) return;
    }

    throw new ForbiddenException('Not allowed to access this student');
  }

  async assertCourseTeacherOrAdmin(actor: AuthUser, courseId: string) {
    if (actor.role === RoleName.ADMIN) return;
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (course.teacherId !== actor.id) {
      throw new ForbiddenException('Only the course teacher can perform this action');
    }
  }

  async getLinkedStudentIds(parentId: string): Promise<string[]> {
    const links = await this.prisma.parentStudent.findMany({
      where: { parentId },
      select: { studentId: true },
    });
    return links.map((l) => l.studentId);
  }
}
