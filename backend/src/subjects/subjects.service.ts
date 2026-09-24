import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogHelper } from '../common/helpers/audit-log.helper';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogHelper,
  ) {}

  async create(dto: CreateSubjectDto, actor: AuthUser) {
    try {
      const subject = await this.prisma.subject.create({ data: dto });
      await this.audit.log({
        actorId: actor.id,
        action: 'SUBJECT_CREATE',
        entityType: 'Subject',
        entityId: subject.id,
      });
      return subject;
    } catch {
      throw new ConflictException('Subject name already exists');
    }
  }

  findAll() {
    return this.prisma.subject.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  async update(id: string, dto: UpdateSubjectDto, actor: AuthUser) {
    await this.findOne(id);
    const subject = await this.prisma.subject.update({
      where: { id },
      data: dto,
    });
    await this.audit.log({
      actorId: actor.id,
      action: 'SUBJECT_UPDATE',
      entityType: 'Subject',
      entityId: id,
    });
    return subject;
  }

  async remove(id: string, actor: AuthUser) {
    await this.findOne(id);
    await this.prisma.subject.delete({ where: { id } });
    await this.audit.log({
      actorId: actor.id,
      action: 'SUBJECT_DELETE',
      entityType: 'Subject',
      entityId: id,
    });
    return { success: true };
  }
}
