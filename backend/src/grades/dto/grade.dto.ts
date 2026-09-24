import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GradeType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateGradeDto {
  @ApiProperty()
  @IsUUID()
  courseId!: string;

  @ApiProperty()
  @IsUUID()
  studentId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  gradeValue!: number;

  @ApiProperty({ enum: GradeType })
  @IsEnum(GradeType)
  gradeType!: GradeType;
}
