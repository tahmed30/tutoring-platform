import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { AccessHelper } from '../common/helpers/access.helper';
import { AuditLogHelper } from '../common/helpers/audit-log.helper';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAssignmentDto,
  GradeSubmissionDto,
  SubmitAssignmentDto,
  UpdateAssignmentDto,
} from './dto/assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessHelper,
    private readonly audit: AuditLogHelper,
  ) {}

  async create(dto: CreateAssignmentDto, actor: AuthUser) {
    await this.access.assertCourseTeacherOrAdmin(actor, dto.courseId);
    const assignment = await this.prisma.assignment.create({
      data: {
        courseId: dto.courseId,
        title: dto.title,
        description: dto.description,
        dueDate: new Date(dto.dueDate),
        maxScore: dto.maxScore,
      },
    });
    await this.audit.log({
      actorId: actor.id,
      action: 'ASSIGNMENT_CREATE',
      entityType: 'Assignment',
      entityId: assignment.id,
    });
    return assignment;
  }

  async findByCourse(courseId: string, actor: AuthUser) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    if (actor.role === RoleName.TEACHER && course.teacherId !== actor.id) {
      throw new ForbiddenException('Not your course');
    }

    return this.prisma.assignment.findMany({
      where: { courseId },
      include: { _count: { select: { submissions: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, teacherId: true } },
        submissions: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async update(id: string, dto: UpdateAssignmentDto, actor: AuthUser) {
    const existing = await this.findOne(id);
    await this.access.assertCourseTeacherOrAdmin(actor, existing.courseId);
    return this.prisma.assignment.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        maxScore: dto.maxScore,
        courseId: dto.courseId,
      },
    });
  }

  async remove(id: string, actor: AuthUser) {
    const existing = await this.findOne(id);
    await this.access.assertCourseTeacherOrAdmin(actor, existing.courseId);
    await this.prisma.assignment.delete({ where: { id } });
    return { success: true };
  }

  async submit(
    assignmentId: string,
    dto: SubmitAssignmentDto,
    actor: AuthUser,
  ) {
    if (actor.role !== RoleName.STUDENT && actor.role !== RoleName.ADMIN) {
      throw new ForbiddenException('Only students can submit assignments');
    }

    const assignment = await this.findOne(assignmentId);
    const studentId = actor.role === RoleName.ADMIN ? actor.id : actor.id;

    const enrolled = await this.prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: assignment.courseId,
          studentId,
        },
      },
    });
    if (!enrolled && actor.role !== RoleName.ADMIN) {
      throw new ForbiddenException('Not enrolled in this course');
    }

    const submission = await this.prisma.studentAssignmentSubmission.upsert({
      where: {
        assignmentId_studentId: { assignmentId, studentId },
      },
      create: {
        assignmentId,
        studentId,
        submissionFileUrl: dto.submissionFileUrl,
      },
      update: {
        submissionFileUrl: dto.submissionFileUrl,
        submittedAt: new Date(),
      },
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'ASSIGNMENT_SUBMIT',
      entityType: 'StudentAssignmentSubmission',
      entityId: submission.id,
    });

    return submission;
  }

  async gradeSubmission(
    submissionId: string,
    dto: GradeSubmissionDto,
    actor: AuthUser,
  ) {
    const submission =
      await this.prisma.studentAssignmentSubmission.findUnique({
        where: { id: submissionId },
        include: { assignment: true },
      });
    if (!submission) throw new NotFoundException('Submission not found');

    await this.access.assertCourseTeacherOrAdmin(
      actor,
      submission.assignment.courseId,
    );

    const updated = await this.prisma.studentAssignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade: dto.grade,
        teacherFeedback: dto.teacherFeedback,
        gradedById: actor.id,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'ASSIGNMENT_GRADE',
      entityType: 'StudentAssignmentSubmission',
      entityId: submissionId,
    });

    return updated;
  }

  async listSubmissions(assignmentId: string, actor: AuthUser) {
    const assignment = await this.findOne(assignmentId);
    await this.access.assertCourseTeacherOrAdmin(actor, assignment.courseId);
    return this.prisma.studentAssignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
