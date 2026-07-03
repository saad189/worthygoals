import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address of the user',
  })
  @IsEmail()
  readonly email: string;

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

  @IsOptional()
  parentId?: number;
}
