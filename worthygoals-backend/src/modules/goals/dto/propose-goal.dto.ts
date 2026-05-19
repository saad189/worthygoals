import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProposeGoalDto {
  @ApiProperty({ example: 'I want to run a half-marathon by October' })
  @IsString()
  @MaxLength(1000)
  raw: string;
}
