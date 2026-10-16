import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExplanationReason } from 'src/common/constants';

export class ExplainTaskDto {
  @ApiProperty({ enum: ExplanationReason })
  @IsEnum(ExplanationReason)
  reason: ExplanationReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000) // sent to the model, stored and embedded
  freeText?: string;

  @ApiPropertyOptional({
    description: 'Personality ID for mentor reaction generation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  personalityId?: string;
}
