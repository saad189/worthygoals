import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString } from 'class-validator';

export class LoginAuthDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email of the user',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Str0ngP@ssw0rd!',
    description: 'The password of the user',
  })
  @IsNotEmpty()
  password: string;
}

export class AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: '708c49fc-c031-7162-c945-84722ffc91a4',
    description: 'The username of the requesting user',
  })
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'refresh token',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
