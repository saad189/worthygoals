import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsDateString,
  IsNumber,
  IsObject,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoalCategory } from 'src/common/constants';

// Every free-text field is spliced into the mentor's system prompt. The quota
// counts calls, not tokens, so unbounded text let 20 free calls each burn a
// full context window.
export class CreateGoalDto {
  @ApiProperty({ example: '20-minute morning run' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: GoalCategory, default: GoalCategory.POWER })
  @IsOptional()
  @IsEnum(GoalCategory)
  category?: GoalCategory;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  mentorId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  costText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  benefitText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  failureText?: string;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ example: { frequency: 'daily' } })
  @IsOptional()
  @IsObject()
  repeatRule?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  stakeAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  imageUri?: string;
}
