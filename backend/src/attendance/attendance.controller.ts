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
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/attendance.dto';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(RoleName.TEACHER, RoleName.ADMIN)
  @ApiOperation({ summary: 'Mark attendance' })
  mark(@Body() dto: MarkAttendanceDto, @CurrentUser() user: AuthUser) {
    return this.attendanceService.mark(dto, user);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Attendance by student' })
  byStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attendanceService.byStudent(studentId, user);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Attendance by course' })
  byCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attendanceService.byCourse(courseId, user);
  }
}
