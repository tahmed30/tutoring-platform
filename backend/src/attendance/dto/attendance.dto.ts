import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class MarkAttendanceDto {
  @ApiProperty()
  @IsUUID()
  courseId!: string;

  @ApiProperty()
  @IsUUID()
  studentId!: string;

  @ApiProperty({ example: '2026-09-24' })
  @IsDateString()
  date!: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
