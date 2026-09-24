import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/types/auth-user';
import { CreatePaymentDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(RoleName.PARENT, RoleName.ADMIN)
  @ApiOperation({ summary: 'Create a payment' })
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthUser) {
    return this.paymentsService.create(dto, user);
  }

  @Get('parent/:parentId')
  @ApiOperation({ summary: 'Payments by parent' })
  byParent(
    @Param('parentId', ParseUUIDPipe) parentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.paymentsService.byParent(parentId, user);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Payments by student' })
  byStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.paymentsService.byStudent(studentId, user);
  }
}
