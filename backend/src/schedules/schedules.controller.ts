import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/types/auth-user';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';
import { SchedulesService } from './schedules.service';

@ApiTags('schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post('schedules')
  @Roles(RoleName.TEACHER, RoleName.ADMIN)
  @ApiOperation({ summary: 'Create class schedule' })
  create(@Body() dto: CreateScheduleDto, @CurrentUser() user: AuthUser) {
    return this.schedulesService.create(dto, user);
  }

  @Get('courses/:courseId/schedules')
  @ApiOperation({ summary: 'List schedules for a course' })
  byCourse(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.schedulesService.findByCourse(courseId);
  }

  @Put('schedules/:id')
  @Roles(RoleName.TEACHER, RoleName.ADMIN)
  @ApiOperation({ summary: 'Update schedule' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schedulesService.update(id, dto, user);
  }

  @Delete('schedules/:id')
  @Roles(RoleName.TEACHER, RoleName.ADMIN)
  @ApiOperation({ summary: 'Delete schedule' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.schedulesService.remove(id, user);
  }
}
