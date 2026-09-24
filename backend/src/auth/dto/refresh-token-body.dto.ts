import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenBodyDto {
  @ApiProperty()
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}
