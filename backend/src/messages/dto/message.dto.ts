import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty()
  @IsUUID()
  receiverId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  messageBody!: string;
}
