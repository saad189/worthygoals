import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateStatusDto {
  @ApiProperty({
    description: 'The free-text status broadcast to the team.',
    maxLength: 500,
    example: 'wrote 500 words today. skipped the run.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text!: string;

  @ApiProperty({
    description:
      "Optional photo — media id from the presign upload path (screen 12's 📷 chip).",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  mediaId?: string;
}
