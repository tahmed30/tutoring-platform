import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser } from '../common/types/auth-user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateUserDto, LinkParentStudentDto, UpdateUserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  me(@CurrentUser() user: AuthUser) {
    return this.usersService.me(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List users (filter by role)' })
  @ApiQuery({ name: 'role', enum: RoleName, required: false })
  findAll(@CurrentUser() user: AuthUser, @Query('role') role?: RoleName) {
    return this.usersService.findAll(user, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.findById(id, user);
  }

  @Post()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Create user (admin)' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser) {
    return this.usersService.create(dto, user);
  }

  @Post('link-parent-student')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Link parent to student (admin)' })
  link(
    @Body() dto: LinkParentStudentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.linkParentStudent(
      dto.parentId,
      dto.studentId,
      user,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Delete user (admin)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.remove(id, user);
  }
}
