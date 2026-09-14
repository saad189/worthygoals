import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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

/**
 * Unauthenticated auth routes sat under the single global bucket of 100
 * req/min with no per-endpoint override, which is a brute-force and
 * enumeration budget rather than a limit.
 *
 * ponytail: tracked per IP, which is what caps probe volume from one source.
 * Capping attempts against a single account across many IPs needs a custom
 * ThrottlerGuard overriding getTracker to key on the body email — worth adding
 * if credential stuffing shows up in the logs. The enumeration fix itself is
 * in AuthService: these endpoints no longer answer differently per address.
 */
const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } };
const ACCOUNT_PROBE_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@ApiTags('Authentication')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle(AUTH_THROTTLE)
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

  @Throttle(AUTH_THROTTLE)
  @Post('signup')
  async signup(@Body() auth: SignUpAuthDto) {
    return this.authService.signUpUser(auth);
  }

  @Throttle(AUTH_THROTTLE)
  @Post('confirm-signup')
  async confirmSignup(@Body() { email, code }: ConfirmSignUpDto) {
    return this.authService.confirmSignUp(email, code);
  }

  @Throttle(ACCOUNT_PROBE_THROTTLE)
  @Post('confirmation-code')
  async resendConfirmationCode(@Body() { email }: ConfirmationCodeDto) {
    return this.authService.resendConfirmationCode(email);
  }

  @Throttle(ACCOUNT_PROBE_THROTTLE)
  @Post('forgot-password-code')
  async triggerForgotPassword(@Body() { email }: ConfirmationCodeDto) {
    return this.authService.triggerForgotPassword(email);
  }

  @Throttle(AUTH_THROTTLE)
  @Post('change-password')
  async confirmChangePassword(@Body() confirmPassDto: ConfirmPasswordDto) {
    return this.authService.confirmForgotPassword(confirmPassDto);
  }
}
