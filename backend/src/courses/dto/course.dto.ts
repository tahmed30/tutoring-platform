import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateCourseDto {
  @ApiProperty()
  @IsUUID()
  subjectId!: string;

  @ApiPropertyOptional({ description: 'Defaults to current teacher' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  gradeLevel!: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}

export class EnrollStudentDto {
  @ApiPropertyOptional({ description: 'Defaults to current student user' })
  @IsOptional()
  @IsUUID()
  studentId?: string;
}
