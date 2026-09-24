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
import { CreateGradeDto } from './dto/grade.dto';
import { GradesService } from './grades.service';

@ApiTags('grades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @Roles(RoleName.TEACHER, RoleName.ADMIN)
  @ApiOperation({ summary: 'Create a grade' })
  create(@Body() dto: CreateGradeDto, @CurrentUser() user: AuthUser) {
    return this.gradesService.create(dto, user);
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Grades by student' })
  byStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.gradesService.byStudent(studentId, user);
  }

  @Get('course/:courseId')
  @Roles(RoleName.TEACHER, RoleName.ADMIN)
  @ApiOperation({ summary: 'Grades by course' })
  byCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.gradesService.byCourse(courseId, user);
  }
}
