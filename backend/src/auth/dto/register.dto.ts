import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PreferredLanguage, RoleName } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ enum: PreferredLanguage })
  @IsOptional()
  @IsEnum(PreferredLanguage)
  preferredLanguage?: PreferredLanguage;

  @ApiPropertyOptional({
    enum: RoleName,
    description: 'Defaults to STUDENT. ADMIN cannot self-register.',
  })
  @IsOptional()
  @IsEnum(RoleName)
  role?: RoleName;
}
