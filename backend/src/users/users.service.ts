import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PreferredLanguage, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AccessHelper } from '../common/helpers/access.helper';
import { AuditLogHelper } from '../common/helpers/audit-log.helper';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  preferredLanguage: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { name: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessHelper,
    private readonly audit: AuditLogHelper,
  ) {}

  async me(userId: string) {
    return this.findById(userId);
  }

  async findAll(actor: AuthUser, role?: RoleName) {
    if (actor.role === RoleName.STUDENT) {
      return [await this.findById(actor.id)];
    }

    if (actor.role === RoleName.PARENT) {
      const studentIds = await this.access.getLinkedStudentIds(actor.id);
      return this.prisma.user.findMany({
        where: { id: { in: [actor.id, ...studentIds] } },
        select: userSelect,
        orderBy: { lastName: 'asc' },
      });
    }

    if (actor.role === RoleName.TEACHER && !role) {
      const enrollments = await this.prisma.courseEnrollment.findMany({
        where: { course: { teacherId: actor.id } },
        select: { studentId: true },
        distinct: ['studentId'],
      });
      const ids = [actor.id, ...enrollments.map((e) => e.studentId)];
      return this.prisma.user.findMany({
        where: { id: { in: ids } },
        select: userSelect,
        orderBy: { lastName: 'asc' },
      });
    }

    return this.prisma.user.findMany({
      where: role ? { role: { name: role } } : undefined,
      select: userSelect,
      orderBy: { lastName: 'asc' },
    });
  }

  async findById(id: string, actor?: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) throw new NotFoundException('User not found');

    if (actor && actor.role !== RoleName.ADMIN && actor.id !== id) {
      if (user.role.name === RoleName.STUDENT) {
        await this.access.assertCanAccessStudent(actor, id);
      } else if (actor.role !== RoleName.ADMIN) {
        throw new ForbiddenException('Not allowed to view this user');
      }
    }

    return user;
  }

  async create(dto: CreateUserDto, actor: AuthUser) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already registered');

    const role = await this.prisma.role.findUnique({
      where: { name: dto.role },
    });
    if (!role) throw new NotFoundException('Role not found');

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        passwordHash: await bcrypt.hash(dto.password, 12),
        preferredLanguage: dto.preferredLanguage ?? PreferredLanguage.EN,
        roleId: role.id,
      },
      select: userSelect,
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'USER_CREATE',
      entityType: 'User',
      entityId: user.id,
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser) {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!existing) throw new NotFoundException('User not found');

    if (actor.role !== RoleName.ADMIN && actor.id !== id) {
      throw new ForbiddenException('Not allowed to update this user');
    }

    if (dto.role && actor.role !== RoleName.ADMIN) {
      throw new ForbiddenException('Only admin can change roles');
    }

    let roleId: string | undefined;
    if (dto.role) {
      const role = await this.prisma.role.findUnique({
        where: { name: dto.role },
      });
      if (!role) throw new NotFoundException('Role not found');
      roleId = role.id;
    }

    if (dto.email && dto.email.toLowerCase() !== existing.email) {
      const clash = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (clash) throw new ConflictException('Email already registered');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        preferredLanguage: dto.preferredLanguage,
        roleId,
        passwordHash: dto.password
          ? await bcrypt.hash(dto.password, 12)
          : undefined,
      },
      select: userSelect,
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'USER_UPDATE',
      entityType: 'User',
      entityId: id,
    });

    return user;
  }

  async remove(id: string, actor: AuthUser) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id } });
    await this.audit.log({
      actorId: actor.id,
      action: 'USER_DELETE',
      entityType: 'User',
      entityId: id,
    });
    return { success: true };
  }

  async linkParentStudent(parentId: string, studentId: string, actor: AuthUser) {
    const [parent, student] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: parentId },
        include: { role: true },
      }),
      this.prisma.user.findUnique({
        where: { id: studentId },
        include: { role: true },
      }),
    ]);

    if (!parent || parent.role.name !== RoleName.PARENT) {
      throw new NotFoundException('Parent user not found');
    }
    if (!student || student.role.name !== RoleName.STUDENT) {
      throw new NotFoundException('Student user not found');
    }

    const link = await this.prisma.parentStudent.upsert({
      where: { parentId_studentId: { parentId, studentId } },
      create: { parentId, studentId },
      update: {},
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'PARENT_STUDENT_LINK',
      entityType: 'ParentStudent',
      entityId: link.id,
    });

    return link;
  }
}
