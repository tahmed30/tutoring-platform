import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateScheduleDto {
  @ApiProperty()
  @IsUUID()
  courseId!: string;

  @ApiPropertyOptional({ description: 'Defaults to course teacher' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiProperty({ enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(TIME_RE)
  startTime!: string;

  @ApiProperty({ example: '10:30' })
  @IsString()
  @Matches(TIME_RE)
  endTime!: string;

  @ApiProperty()
  @IsString()
  location!: string;
}

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {}
