import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfirmPasswordDto, SignUpAuthDto } from './dto/sign-up.dto';
import { AuthTokens, LoginAuthDto, RefreshTokenDto } from './dto/sign-in.dto';
import { AWSCognitoService } from './aws-cognito.service';

/** The one answer both account-probe endpoints ever give. */
const DELIVERY_MEDIUM = 'EMAIL';

/** The one answer a failed sign-in ever gives. */
const INVALID_CREDENTIALS = 'Incorrect email or password';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(private readonly awsService: AWSCognitoService) {}

  /**
   * AWSCognitoService already normalises everything it throws into an
   * HttpException. Rebuilding one from `error.status` produced an exception
   * with an undefined status whenever the cause was not an AWS error.
   */
  private rethrow(error: unknown): HttpException {
    return error instanceof HttpException
      ? error
      : new InternalServerErrorException();
  }

  async signUpUser(auth: SignUpAuthDto): Promise<true> {
    try {
      await this.awsService.signUpUser(auth);
      return true;
    } catch (error) {
      this.logger.error(
        `${AuthService.name}:${this.signUpUser.name}: ${JSON.stringify(error.message)}`,
      );
      throw this.rethrow(error);
    }
  }

  async loginUser(loginAuth: LoginAuthDto): Promise<AuthTokens> {
    try {
      return await this.awsService.loginUser(loginAuth);
    } catch (error) {
      this.logger.error(
        `${AuthService.name}:${this.loginUser.name}: ${JSON.stringify(error.message)}`,
      );
      // An unknown address and a wrong password must be indistinguishable.
      // Cognito's UserNotFoundException says which one it was.
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
  }

  async refreshTokens(refreshDto: RefreshTokenDto): Promise<AuthTokens> {
    try {
      const { username, refreshToken } = refreshDto;
      if (!username || !refreshToken) throw new BadRequestException();

      return await this.awsService.refreshTokens(username, refreshToken);
    } catch (error) {
      this.logger.error(
        `${AuthService.name}:${this.refreshTokens.name}: ${JSON.stringify(error.message)}`,
      );
      throw this.rethrow(error);
    }
  }

  async logoutUser(accessToken: string): Promise<void> {
    try {
      await this.awsService.logoutUser(accessToken);
    } catch (error) {
      this.logger.error(
        `${AuthService.name}:${this.logoutUser.name}: ${JSON.stringify(error.message)}`,
      );
      throw this.rethrow(error);
    }
  }

  async confirmSignUp(identity: string, code: string): Promise<true> {
    try {
      await this.awsService.confirmSignUp(identity, code);
      return true;
    } catch (error) {
      this.logger.error(
        `${AWSCognitoService.name}:${this.confirmSignUp.name}: ${JSON.stringify(error.message)}`,
      );
      throw this.rethrow(error);
    }
  }

  /**
   * Both of these take an email and are unauthenticated, so their response is
   * an account-existence oracle. They used to have three distinguishable
   * outcomes — not registered, already confirmed, unconfirmed — because raw
   * Cognito error text was passed straight through.
   *
   * The outcome is now identical whatever the address: the caller is told a
   * code was sent if one was needed. The real result is logged server-side.
   */
  async resendConfirmationCode(identity: string): Promise<string> {
    try {
      const response = await this.awsService.resendConfirmationCode(identity);
      return response?.CodeDeliveryDetails?.DeliveryMedium ?? DELIVERY_MEDIUM;
    } catch (error) {
      this.logger.error(
        `${AuthService.name}:${this.resendConfirmationCode.name}: ${JSON.stringify(error.message)}`,
      );
      return DELIVERY_MEDIUM;
    }
  }

  async triggerForgotPassword(email: string): Promise<string> {
    try {
      const response = await this.awsService.triggerForgotPassword(email);
      return response?.CodeDeliveryDetails?.DeliveryMedium ?? DELIVERY_MEDIUM;
    } catch (error) {
      this.logger.error(
        `${AuthService.name}:${this.triggerForgotPassword.name}: ${JSON.stringify(error.message)}`,
      );
      return DELIVERY_MEDIUM;
    }
  }

  async confirmForgotPassword({
    email,
    code,
    password,
  }: ConfirmPasswordDto): Promise<true> {
    try {
      await this.awsService.confirmForgotPassword(email, code, password);
      return true;
    } catch (error) {
      this.logger.error(
        `${AWSCognitoService.name}:${this.confirmForgotPassword.name}: ${JSON.stringify(error.message)}`,
      );
      throw this.rethrow(error);
    }
  }
}
