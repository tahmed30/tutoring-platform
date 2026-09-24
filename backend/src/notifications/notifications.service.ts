import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { AuditLogHelper } from '../common/helpers/audit-log.helper';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogHelper,
  ) {}

  async list(actor: AuthUser) {
    return this.prisma.notification.findMany({
      where: { userId: actor.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateNotificationDto, actor: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException('User not found');

    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        message: dto.message,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'NOTIFICATION_CREATE',
      entityType: 'Notification',
      entityId: notification.id,
    });

    return notification;
  }

  async markRead(id: string, actor: AuthUser) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    if (
      notification.userId !== actor.id &&
      actor.role !== RoleName.ADMIN
    ) {
      throw new ForbiddenException('Not your notification');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { readStatus: true },
    });
  }
}
