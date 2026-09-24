import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PreferredLanguage, RoleName } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
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

  @ApiProperty({ enum: RoleName })
  @IsEnum(RoleName)
  role!: RoleName;

  @ApiPropertyOptional({ enum: PreferredLanguage })
  @IsOptional()
  @IsEnum(PreferredLanguage)
  preferredLanguage?: PreferredLanguage;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class LinkParentStudentDto {
  @ApiProperty()
  @IsString()
  parentId!: string;

  @ApiProperty()
  @IsString()
  studentId!: string;
}
