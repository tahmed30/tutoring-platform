import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAssignmentDto {
  @ApiProperty()
  @IsUUID()
  courseId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsDateString()
  dueDate!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxScore!: number;
}

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {}

export class SubmitAssignmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  submissionFileUrl?: string;
}

export class GradeSubmissionDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  grade!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teacherFeedback?: string;
}
