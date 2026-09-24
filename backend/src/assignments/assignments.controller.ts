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
import { AssignmentsService } from './assignments.service';
import {
  CreateAssignmentDto,
  GradeSubmissionDto,
  SubmitAssignmentDto,
  UpdateAssignmentDto,
} from './dto/assignment.dto';

@ApiTags('assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post('assignments')
  @Roles(RoleName.TEACHER, RoleName.ADMIN)
  @ApiOperation({ summary: 'Create assignment' })
  create(@Body() dto: CreateAssignmentDto, @CurrentUser() user: AuthUser) {
    return this.assignmentsService.create(dto, user);
  }

  @Get('courses/:courseId/assignments')
  @ApiOperation({ summary: 'List assignments for a course' })
  byCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.assignmentsService.findByCourse(courseId, user);
  }

  @Get('assignments/:id')
  @ApiOperation({ summary: 'Get assignment' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Put('assignments/:id')
  @Roles(RoleName.TEACHER, RoleName.ADMIN)
  @ApiOperation({ summary: 'Update assignment' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssignmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.assignmentsService.update(id, dto, user);
  }

  @Delete('assignments/:id')
  @Roles(RoleName.TEACHER, RoleName.ADMIN)
  @ApiOperation({ summary: 'Delete assignment' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.assignmentsService.remove(id, user);
  }

  @Post('assignments/:id/submissions')
  @Roles(RoleName.STUDENT, RoleName.ADMIN)
  @ApiOperation({ summary: 'Submit assignment' })
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitAssignmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.assignmentsService.submit(id, dto, user);
  }

  @Get('assignments/:id/submissions')
  @Roles(RoleName.TEACHER, RoleName.ADMIN)
  @ApiOperation({ summary: 'List submissions' })
  listSubmissions(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.assignmentsService.listSubmissions(id, user);
  }

  @Put('submissions/:id/grade')
  @Roles(RoleName.TEACHER, RoleName.ADMIN)
  @ApiOperation({ summary: 'Grade a submission' })
  grade(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GradeSubmissionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.assignmentsService.gradeSubmission(id, dto, user);
  }
}
