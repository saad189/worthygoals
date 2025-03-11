import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsDateString, IsNumber, IsUUID, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({
        example: '12345678-1234-1234-1234-123456789012',
        description: 'The unique identifier of the user',
    })
    @IsUUID()
    @IsString()
    readonly sub: string;  // Cognito 'sub'

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
        description: 'The latitude of the user\'s location',
        required: false,
    })
    @IsOptional()
    @IsNumber()
    readonly latitude?: number;

    @ApiProperty({
        example: -122.4194,
        description: 'The longitude of the user\'s location',
        required: false,
    })
    @IsOptional()
    @IsNumber()
    readonly longitude?: number;


    @IsOptional()
    parentId?: number;
}
