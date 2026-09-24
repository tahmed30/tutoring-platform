import { Injectable, NotFoundException } from '@nestjs/common';
import { AccessHelper } from '../common/helpers/access.helper';
import { AuditLogHelper } from '../common/helpers/audit-log.helper';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessHelper,
    private readonly audit: AuditLogHelper,
  ) {}

  async create(dto: CreateScheduleDto, actor: AuthUser) {
    await this.access.assertCourseTeacherOrAdmin(actor, dto.courseId);
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    const schedule = await this.prisma.classSchedule.create({
      data: {
        courseId: dto.courseId,
        teacherId: dto.teacherId ?? course.teacherId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        location: dto.location,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'SCHEDULE_CREATE',
      entityType: 'ClassSchedule',
      entityId: schedule.id,
    });

    return schedule;
  }

  async findByCourse(courseId: string) {
    return this.prisma.classSchedule.findMany({
      where: { courseId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async update(id: string, dto: UpdateScheduleDto, actor: AuthUser) {
    const existing = await this.prisma.classSchedule.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Schedule not found');
    await this.access.assertCourseTeacherOrAdmin(actor, existing.courseId);

    return this.prisma.classSchedule.update({
      where: { id },
      data: {
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        location: dto.location,
        teacherId: dto.teacherId,
        courseId: dto.courseId,
      },
    });
  }

  async remove(id: string, actor: AuthUser) {
    const existing = await this.prisma.classSchedule.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Schedule not found');
    await this.access.assertCourseTeacherOrAdmin(actor, existing.courseId);
    await this.prisma.classSchedule.delete({ where: { id } });
    return { success: true };
  }
}
