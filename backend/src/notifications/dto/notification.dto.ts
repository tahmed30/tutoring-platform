import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';
import { IsEnum, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  message!: string;
}
