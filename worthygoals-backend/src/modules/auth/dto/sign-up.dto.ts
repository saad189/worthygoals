import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  Validate,
  IsStrongPassword,
} from 'class-validator';
import {
  PASSWORD_OPTIONS,
  PASSWORD_VALIDATIONOPTIONS,
} from 'src/common/constants';
import { MatchPasswords } from 'src/common/validators';

export class SignUpAuthDto {
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
  @IsStrongPassword(PASSWORD_OPTIONS, PASSWORD_VALIDATIONOPTIONS)
  password: string;

  @ApiProperty({
    example: 'Str0ngP@ssw0rd!',
    description: 'The repeated password of the user',
  })
  @IsNotEmpty()
  @IsStrongPassword(PASSWORD_OPTIONS, PASSWORD_VALIDATIONOPTIONS)
  @Validate(MatchPasswords)
  repeatedPassword: string;
}

export class UpdateAuthDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email of the user',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'NewStr0ngP@ssw0rd!',
    description: 'The new password of the user',
  })
  @IsStrongPassword(PASSWORD_OPTIONS, PASSWORD_VALIDATIONOPTIONS)
  password: string;

  @ApiProperty({
    example: 'Str0ngP@ssw0rd!',
    description: 'The repeated password of the user',
  })
  @IsNotEmpty()
  @IsStrongPassword(PASSWORD_OPTIONS, PASSWORD_VALIDATIONOPTIONS)
  @Validate(MatchPasswords)
  repeatedPassword: string;
}

export class ConfirmationCodeDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email of the user',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class ConfirmSignUpDto extends ConfirmationCodeDto {
  @ApiProperty({
    type: 'string',
    description: 'The confirmation code received by the user',
    example: '123456',
  })
  code: string;
}

export class ConfirmPasswordDto extends ConfirmSignUpDto {
  @ApiProperty({
    example: 'NewStr0ngP@ssw0rd!',
    description: 'The new password of the user',
  })
  @IsStrongPassword(PASSWORD_OPTIONS, PASSWORD_VALIDATIONOPTIONS)
  password: string;

  @ApiProperty({
    example: 'Str0ngP@ssw0rd!',
    description: 'The repeated password of the user',
  })
  @IsNotEmpty()
  @IsStrongPassword(PASSWORD_OPTIONS, PASSWORD_VALIDATIONOPTIONS)
  @Validate(MatchPasswords)
  repeatedPassword: string;
}
