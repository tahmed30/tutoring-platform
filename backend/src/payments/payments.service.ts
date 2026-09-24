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
import { CreatePaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessHelper,
    private readonly audit: AuditLogHelper,
  ) {}

  async create(dto: CreatePaymentDto, actor: AuthUser) {
    if (actor.role === RoleName.PARENT) {
      dto.parentId = actor.id;
      const link = await this.prisma.parentStudent.findUnique({
        where: {
          parentId_studentId: {
            parentId: actor.id,
            studentId: dto.studentId,
          },
        },
      });
      if (!link) {
        throw new ForbiddenException('Student is not linked to this parent');
      }
    } else if (actor.role !== RoleName.ADMIN) {
      throw new ForbiddenException('Only parents or admin can create payments');
    }

    const payment = await this.prisma.payment.create({
      data: {
        parentId: dto.parentId,
        studentId: dto.studentId,
        amount: dto.amount,
        currency: dto.currency ?? 'USD',
        paymentMethod: dto.paymentMethod,
        status: dto.status,
        referenceId: dto.referenceId,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'PAYMENT_CREATE',
      entityType: 'Payment',
      entityId: payment.id,
    });

    return payment;
  }

  async byParent(parentId: string, actor: AuthUser) {
    if (
      actor.role !== RoleName.ADMIN &&
      !(actor.role === RoleName.PARENT && actor.id === parentId)
    ) {
      throw new ForbiddenException('Not allowed');
    }

    return this.prisma.payment.findMany({
      where: { parentId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async byStudent(studentId: string, actor: AuthUser) {
    await this.access.assertCanAccessStudent(actor, studentId);

    if (
      actor.role === RoleName.STUDENT &&
      actor.id !== studentId
    ) {
      throw new ForbiddenException('Not allowed');
    }

    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.payment.findMany({
      where: { studentId },
      include: {
        parent: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }
}
