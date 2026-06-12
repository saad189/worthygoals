import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginAuthDto, RefreshTokenDto } from './dto/sign-in.dto';
import {
  ConfirmationCodeDto,
  ConfirmPasswordDto,
  ConfirmSignUpDto,
  SignUpAuthDto,
} from './dto/sign-up.dto';
import { JwtAuthGuard } from 'src/common/guards';

@ApiTags('Authentication')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() auth: LoginAuthDto) {
    return this.authService.loginUser(auth);
  }

  @Post('refresh-token')
  async refresh(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new BadRequestException('Authorization header not found');
    }

    const token = authHeader.split(' ')[1]; // 'Bearer <token>'
    return this.authService.logoutUser(token);
  }

  @Post('signup')
  async signup(@Body() auth: SignUpAuthDto) {
    return this.authService.signUpUser(auth);
  }

  @Post('confirm-signup')
  async confirmSignup(@Body() { email, code }: ConfirmSignUpDto) {
    return this.authService.confirmSignUp(email, code);
  }

  @Post('confirmation-code')
  async resendConfirmationCode(@Body() { email }: ConfirmationCodeDto) {
    return this.authService.resendConfirmationCode(email);
  }

  @Post('forgot-password-code')
  async triggerForgotPassword(@Body() { email }: ConfirmationCodeDto) {
    return this.authService.triggerForgotPassword(email);
  }

  @Post('change-password')
  async confirmChangePassword(@Body() confirmPassDto: ConfirmPasswordDto) {
    return this.authService.confirmForgotPassword(confirmPassDto);
  }
}
