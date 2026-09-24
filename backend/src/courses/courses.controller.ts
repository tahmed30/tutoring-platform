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
import { CoursesService } from './courses.service';
import {
  CreateCourseDto,
  EnrollStudentDto,
  UpdateCourseDto,
} from './dto/course.dto';

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(RoleName.TEACHER, RoleName.ADMIN)
  @ApiOperation({ summary: 'Create a course' })
  create(@Body() dto: CreateCourseDto, @CurrentUser() user: AuthUser) {
    return this.coursesService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List courses visible to current user' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.coursesService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course details' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coursesService.findOne(id, user);
  }

  @Put(':id')
  @Roles(RoleName.TEACHER, RoleName.ADMIN)
  @ApiOperation({ summary: 'Update a course' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coursesService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(RoleName.TEACHER, RoleName.ADMIN)
  @ApiOperation({ summary: 'Delete a course' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coursesService.remove(id, user);
  }

  @Post(':id/enrollments')
  @Roles(RoleName.STUDENT, RoleName.TEACHER, RoleName.ADMIN)
  @ApiOperation({ summary: 'Enroll a student in a course' })
  enroll(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EnrollStudentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coursesService.enroll(id, dto.studentId ?? user.id, user);
  }

  @Get(':id/enrollments')
  @ApiOperation({ summary: 'List course enrollments' })
  listEnrollments(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coursesService.listEnrollments(id, user);
  }

  @Delete(':id/enrollments/:studentId')
  @Roles(RoleName.TEACHER, RoleName.ADMIN)
  @ApiOperation({ summary: 'Remove enrollment' })
  unenroll(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.coursesService.unenroll(id, studentId, user);
  }
}
