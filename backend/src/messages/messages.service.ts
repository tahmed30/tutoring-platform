import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditLogHelper } from '../common/helpers/audit-log.helper';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/message.dto';

const userSnippet = {
  select: { id: true, firstName: true, lastName: true, email: true },
} as const;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogHelper,
  ) {}

  async send(dto: SendMessageDto, actor: AuthUser) {
    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverId },
    });
    if (!receiver) throw new NotFoundException('Receiver not found');

    const message = await this.prisma.message.create({
      data: {
        senderId: actor.id,
        receiverId: dto.receiverId,
        messageBody: dto.messageBody,
      },
      include: {
        sender: userSnippet,
        receiver: userSnippet,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'MESSAGE_SEND',
      entityType: 'Message',
      entityId: message.id,
    });

    return message;
  }

  async inbox(actor: AuthUser) {
    return this.prisma.message.findMany({
      where: { receiverId: actor.id },
      include: { sender: userSnippet },
      orderBy: { sentAt: 'desc' },
    });
  }

  async conversation(otherUserId: string, actor: AuthUser) {
    const other = await this.prisma.user.findUnique({
      where: { id: otherUserId },
    });
    if (!other) throw new NotFoundException('User not found');

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: actor.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: actor.id },
        ],
      },
      include: {
        sender: userSnippet,
        receiver: userSnippet,
      },
      orderBy: { sentAt: 'asc' },
    });

    await this.prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: actor.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return messages;
  }
}
