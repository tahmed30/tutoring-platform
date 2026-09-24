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
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { SubjectsService } from './subjects.service';

@ApiTags('subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List subjects' })
  findAll() {
    return this.subjectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subject' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.subjectsService.findOne(id);
  }

  @Post()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Create subject (admin)' })
  create(@Body() dto: CreateSubjectDto, @CurrentUser() user: AuthUser) {
    return this.subjectsService.create(dto, user);
  }

  @Put(':id')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Update subject (admin)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubjectDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.subjectsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Delete subject (admin)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.subjectsService.remove(id, user);
  }
}
