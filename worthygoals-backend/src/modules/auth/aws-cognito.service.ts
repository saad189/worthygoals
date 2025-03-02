import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  AdminGetUserCommand,
  AdminDeleteUserCommand,
  GetUserCommand,
  ListUsersCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ConfirmForgotPasswordCommandOutput,
  ForgotPasswordCommandOutput,
  AdminGetUserCommandOutput,
  UserType,
  GetUserCommandOutput,
  ResendConfirmationCodeCommandOutput,
  ConfirmSignUpCommandOutput,
  SignUpCommandOutput,
  GlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as crypto from 'crypto';
import { SignUpAuthDto } from './dto/sign-up.dto';
import { AuthTokens, LoginAuthDto } from './dto/sign-in.dto';

@Injectable()
export class AWSCognitoService {
  private logger = new Logger(AWSCognitoService.name);
  private cognitoClient: CognitoIdentityProviderClient;
  private clientId: string;
  private clientSecret: string;
  private userPoolId: string;

  constructor() {
    // Read these from your environment variables
    this.clientId = process.env.AWS_COGNITO_APP_CLIENT_ID;
    this.clientSecret = process.env.AWS_COGNITO_APP_CLIENT_SECRET;
    this.userPoolId = process.env.AWS_COGNITO_USER_POOL_ID;
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || 'eu-north-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  /**
   * Computes the secret hash required when using a client secret.
   * The algorithm is: Base64( HMAC-SHA256(clientSecret, username + clientId) )
   */
  private generateSecretHash(username: string): string {
    return crypto
      .createHmac('SHA256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }

  async loginUser({ email, password }: LoginAuthDto): Promise<AuthTokens> {
    try {
      const secretHash = this.generateSecretHash(email);

      const command = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: 'USER_PASSWORD_AUTH', // Using this flow for direct authentication.
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: secretHash,
        },
      });

      const response = await this.cognitoClient.send(command);

      // Check if authentication succeeded.
      if (!response.AuthenticationResult) {
        throw new UnauthorizedException('Authentication failed');
      }

      // Return tokens (AccessToken, IdToken, RefreshToken) to the client.
      return {
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
      };
    } catch (error) {
      this.logger.error(
        `${AWSCognitoService.name}:${this.loginUser.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(
        error.message,
        error.status || error.$metadata.httpStatusCode,
      );
    }
  }

  async refreshTokens(
    identity: string,
    refreshToken: string,
  ): Promise<AuthTokens> {
    try {
      const secretHash = this.generateSecretHash(identity);
      const command = new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
          SECRET_HASH: secretHash,
          USERNAME: identity,
        },
      });

      const response = await this.cognitoClient.send(command);

      if (!response.AuthenticationResult) {
        throw new UnauthorizedException('Authentication failed');
      }

      return {
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error(
        `${AWSCognitoService.name}:${this.refreshTokens.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(
        error.message,
        error.status || error.$metadata.httpStatusCode,
      );
    }
  }

  async logoutUser(accessToken: string): Promise<void> {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });
      await this.cognitoClient.send(command);
    } catch (error) {
      this.logger.error(
        `${AWSCognitoService.name}:${this.logoutUser.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(
        error.message,
        error.status || error.$metadata.httpStatusCode,
      );
    }
  }
  /**
   * Signs up a new user.
   * Note: The user will be created in an unconfirmed state.
   * A confirmation code will be sent to the user's email.
   */
  async signUpUser(auth: SignUpAuthDto): Promise<SignUpCommandOutput> {
    try {
      const secretHash = this.generateSecretHash(auth.email);

      const command = new SignUpCommand({
        ClientId: this.clientId,
        Username: auth.email, // Using email as the username; adjust as needed.
        Password: auth.password,
        SecretHash: secretHash,
        UserAttributes: [{ Name: 'email', Value: auth.email }],
      });

      const response = await this.cognitoClient.send(command);
      // Response typically contains details like userConfirmed and codeDeliveryDetails.
      return response;
    } catch (error) {
      this.logger.log(
        `${AWSCognitoService.name}:${this.signUpUser.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(
        error.message,
        error.status || error.$metadata.httpStatusCode,
      );
    }
  }

  /**
   * Confirms the user sign-up using the confirmation code sent via email.
   * This is the standard confirmation flow.
   */
  async confirmSignUp(
    username: string,
    code: string,
  ): Promise<ConfirmSignUpCommandOutput> {
    try {
      const secretHash = this.generateSecretHash(username);
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: username,
        ConfirmationCode: code,
        SecretHash: secretHash,
      });
      const response = await this.cognitoClient.send(command);
      return response;
    } catch (error) {
      this.logger.error(
        `${AWSCognitoService.name}:${this.confirmSignUp.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(
        error.message,
        error.status || error.$metadata.httpStatusCode,
      );
    }
  }

  async resendConfirmationCode(
    username: string,
  ): Promise<ResendConfirmationCodeCommandOutput> {
    try {
      const userCommand = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });
      const userResponse = await this.cognitoClient.send(userCommand);

      if (userResponse.UserStatus !== 'UNCONFIRMED') {
        throw new BadRequestException('User is already confirmed');
      }

      const secretHash = this.generateSecretHash(username);
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.clientId,
        Username: username,
        SecretHash: secretHash,
      });
      const response = await this.cognitoClient.send(command);
      return response;
    } catch (error) {
      this.logger.error(
        `${AWSCognitoService.name}:${this.resendConfirmationCode.name}: ${JSON.stringify(error.message)}`,
      );

      throw new HttpException(
        error.message,
        error.status || error.$metadata.httpStatusCode,
      );
    }
  }

  async getUserByToken(accessToken: string): Promise<GetUserCommandOutput> {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });
      const response = await this.cognitoClient.send(command);
      return response;
    } catch (error) {
      this.logger.error(
        `${AWSCognitoService.name}:${this.getUserByToken.name}: ${JSON.stringify(error.message)}`,
      );
      throw new UnauthorizedException('Invalid access token');
    }
  }

  async findAll(): Promise<UserType[]> {
    try {
      const command = new ListUsersCommand({
        UserPoolId: this.userPoolId,
      });
      const response = await this.cognitoClient.send(command);
      return response.Users;
    } catch (error) {
      this.logger.error(
        `${AWSCognitoService.name}:${this.findAll.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(
        error.message,
        error.status || error.$metadata.httpStatusCode,
      );
    }
  }

  async findOne(identity: string): Promise<AdminGetUserCommandOutput> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: identity,
      });
      const response = await this.cognitoClient.send(command);
      return response;
    } catch (error) {
      this.logger.error(
        `${AWSCognitoService.name}:${this.findOne.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(
        error.message,
        error.status || error.$metadata.httpStatusCode,
      );
    }
  }

  async triggerForgotPassword(
    email: string,
  ): Promise<ForgotPasswordCommandOutput> {
    try {
      const secretHash = this.generateSecretHash(email);
      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
        SecretHash: secretHash,
      });
      const response = await this.cognitoClient.send(command);

      return response;
    } catch (error) {
      this.logger.error(
        `${AWSCognitoService.name}:${this.triggerForgotPassword.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(
        error.message,
        error.status || error.$metadata.httpStatusCode,
      );
    }
  }

  async confirmForgotPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<ConfirmForgotPasswordCommandOutput> {
    try {
      const secretHash = this.generateSecretHash(email);
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
        SecretHash: secretHash,
      });
      const response = await this.cognitoClient.send(command);
      return response;
    } catch (error) {
      this.logger.error(
        `${AWSCognitoService.name}:${this.confirmForgotPassword.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(
        error.message,
        error.status || error.$metadata.httpStatusCode,
      );
    }
  }

  async remove(sub: string): Promise<void> {
    try {
      const command = new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: sub,
      });
      await this.cognitoClient.send(command);
    } catch (error) {
      this.logger.error(
        `${AWSCognitoService.name}:${this.remove.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(
        error.message,
        error.status || error.$metadata.httpStatusCode,
      );
    }
  }
}
