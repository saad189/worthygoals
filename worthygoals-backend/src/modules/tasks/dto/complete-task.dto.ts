import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
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
  @MaxLength(2000) // sent to the model, stored and embedded
  reflection?: string;

  @ApiPropertyOptional({ description: 'UUID of an uploaded media item (M06)' })
  @IsOptional()
  @IsUUID() // a media id; the column is varchar(36)
  memoryPictureId?: string;

  @ApiPropertyOptional({
    description: 'Personality ID for mentor reaction generation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  personalityId?: string;
}
