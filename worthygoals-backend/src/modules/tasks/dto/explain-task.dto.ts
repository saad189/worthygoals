import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExplanationReason } from 'src/common/constants';

export class ExplainTaskDto {
  @ApiProperty({ enum: ExplanationReason })
  @IsEnum(ExplanationReason)
  reason: ExplanationReason;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  freeText?: string;
}
