import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskRepeatFrequency } from 'src/common/constants';

export class CreateTaskDto {
  @ApiProperty({ example: 'Morning 5km run' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'goal-uuid-here' })
  @IsUUID()
  goalId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: '2026-06-01T07:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    enum: TaskRepeatFrequency,
    default: TaskRepeatFrequency.NONE,
  })
  @IsOptional()
  @IsEnum(TaskRepeatFrequency)
  repeatFrequency?: TaskRepeatFrequency;
}
