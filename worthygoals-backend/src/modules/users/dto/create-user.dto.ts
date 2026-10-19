import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  IsTimeZone,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description:
      "Ignored — the profile takes the Cognito account's email. Accepted so existing clients don't fail validation.",
    required: false,
  })
  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @ApiProperty({
    example: 'John',
    description: 'The first name of the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly lastName?: string;

  @ApiProperty({
    example: '1990-01-01',
    description: 'The date of birth of the user',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  readonly dateOfBirth?: string;

  @ApiProperty({
    example: 'm',
    description: 'The gender of the user',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1) // users.gender is char(1); a longer value was a 500
  readonly gender?: string;

  @ApiProperty({
    example: 37.7749,
    description: "The latitude of the user's location",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  readonly latitude?: number;

  @ApiProperty({
    example: -122.4194,
    description: "The longitude of the user's location",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  readonly longitude?: number;

  @ApiProperty({
    example: 'firm',
    description:
      "The user's onboarding tone preference (forced-choice deck result)",
    required: false,
  })
  @IsOptional()
  @IsIn(['soft', 'firm', 'intense'])
  readonly tone?: string;

  @ApiProperty({
    example: 'marcus',
    description: "The user's onboarding-matched mentor (personality slug)",
    required: false,
  })
  @IsOptional()
  @IsIn(['marcus', 'lyra', 'goggs'])
  readonly personalityId?: string;

  @ApiProperty({
    example: 'Asia/Karachi',
    description:
      "The device's IANA timezone. The app re-sends it whenever it changes; every 'today' is computed in it.",
    required: false,
  })
  @IsOptional()
  @IsTimeZone()
  readonly timezone?: string;
}
