import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ConfirmPasswordDto, SignUpAuthDto } from './dto/sign-up.dto';
import { AuthTokens, LoginAuthDto, RefreshTokenDto } from './dto/sign-in.dto';
import { AWSCognitoService } from './aws-cognito.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private readonly awsService: AWSCognitoService,
    private readonly userService: UsersService,
  ) { }

  async signUpUser(auth: SignUpAuthDto): Promise<any> {
    try {
      await this.awsService.signUpUser(auth);
      return true;
    } catch (error) {
      this.logger.log(
        `${AuthService.name}:${this.signUpUser.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async loginUser(loginAuth: LoginAuthDto): Promise<AuthTokens> {
    try {
      return this.awsService.loginUser(loginAuth);
    } catch (error) {
      this.logger.log(
        `${AuthService.name}:${this.loginUser.name}: ${JSON.stringify(error.message)}`,
      );
      console.log({ error });
      throw new HttpException(error.message, error.status);
    }
  }

  async refreshTokens(refreshDto: RefreshTokenDto): Promise<any> {
    try {
      const { username, refreshToken } = refreshDto;
      if (!username || !refreshToken) throw new BadRequestException();

      return this.awsService.refreshTokens(username, refreshToken);
    } catch (error) {
      this.logger.log(
        `${AuthService.name}:${this.refreshTokens.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async logoutUser(accessToken: string): Promise<void> {
    try {
      await this.awsService.logoutUser(accessToken);
    } catch (error) {
      this.logger.log(
        `${AuthService.name}:${this.logoutUser.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async findAll(): Promise<any[]> {
    try {
      const response = await this.awsService.findAll();
      return response;
    } catch (error) {
      this.logger.log(
        `${AuthService.name}:${this.findAll.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async findOne(identity: string, isSub: boolean): Promise<any> {
    try {
      const response = await this.awsService.findOne(identity);
      return response;
    } catch (error) {
      this.logger.log(
        `${AuthService.name}:${this.findOne.name}: ${JSON.stringify(error.message)}`,
      );
      throw new NotFoundException(
        `User with ${isSub ? 'sub' : 'email'}: ${identity} not found.`,
      );
    }
  }

  async confirmSignUp(identity: string, code: string): Promise<any> {
    try {
      await this.awsService.confirmSignUp(identity, code);
      return true;
    } catch (error) {
      this.logger.error(
        `${AWSCognitoService.name}:${this.confirmSignUp.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async resendConfirmationCode(identity: string): Promise<string> {
    try {
      const response = await this.awsService.resendConfirmationCode(identity);
      return response.CodeDeliveryDetails.DeliveryMedium;
    } catch (error) {
      this.logger.error(
        `${AWSCognitoService.name}:${this.resendConfirmationCode.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async triggerForgotPassword(email: string): Promise<string> {
    try {
      const response = await this.awsService.triggerForgotPassword(email);
      return response.CodeDeliveryDetails.DeliveryMedium;
    } catch (error) {
      this.logger.error(
        `${AWSCognitoService.name}:${this.triggerForgotPassword.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async confirmForgotPassword({
    email,
    code,
    password,
  }: ConfirmPasswordDto): Promise<any> {
    try {
      await this.awsService.confirmForgotPassword(email, code, password);
      return true;
    } catch (error) {
      this.logger.error(
        `${AWSCognitoService.name}:${this.confirmForgotPassword.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async remove(identity: string): Promise<void> {
    try {
      await this.awsService.remove(identity);
      await this.userService.removeWithIdentity(identity);
    } catch (error) {
      this.logger.log(
        `${AuthService.name}:${this.remove.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
