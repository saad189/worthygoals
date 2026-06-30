import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

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
}
