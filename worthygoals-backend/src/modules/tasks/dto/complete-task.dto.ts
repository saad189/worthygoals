import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteTaskDto {
  /** 1 = 😣  2 = 😐  3 = 🙂  4 = 🔥 */
  @ApiProperty({ minimum: 1, maximum: 4, example: 3 })
  @IsInt()
  @Min(1)
  @Max(4)
  moodScore: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reflection?: string;

  @ApiPropertyOptional({ description: 'UUID of an uploaded media item (M06)' })
  @IsOptional()
  @IsString()
  memoryPictureId?: string;

  @ApiPropertyOptional({
    description: 'Personality ID for mentor reaction generation',
  })
  @IsOptional()
  @IsString()
  personalityId?: string;
}
