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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { SendMessageDto } from './dto/message.dto';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  send(@Body() dto: SendMessageDto, @CurrentUser() user: AuthUser) {
    return this.messagesService.send(dto, user);
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Inbox for current user' })
  inbox(@CurrentUser() user: AuthUser) {
    return this.messagesService.inbox(user);
  }

  @Get('conversation/:userId')
  @ApiOperation({ summary: 'Conversation with another user' })
  conversation(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messagesService.conversation(userId, user);
  }
}
