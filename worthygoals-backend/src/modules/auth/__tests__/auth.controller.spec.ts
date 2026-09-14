import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { AWSCognitoService } from '../aws-cognito.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: {} }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

/**
 * Guards B6. Raw Cognito error text let POST /auth/confirmation-code and
 * /auth/forgot-password-code distinguish not-registered / confirmed /
 * unconfirmed, and a failed login said whether the address existed.
 */
describe('AuthService — account-existence responses are uniform', () => {
  let service: AuthService;
  const aws = {
    loginUser: jest.fn(),
    resendConfirmationCode: jest.fn(),
    triggerForgotPassword: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: AWSCognitoService, useValue: aws }],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  const NOT_REGISTERED = Object.assign(new Error('User does not exist.'), {
    name: 'UserNotFoundException',
  });
  const ALREADY_CONFIRMED = new BadRequestException('User is already confirmed');
  const SENT = { CodeDeliveryDetails: { DeliveryMedium: 'EMAIL' } };

  it('answers confirmation-code identically for every account state', async () => {
    aws.resendConfirmationCode
      .mockRejectedValueOnce(NOT_REGISTERED)
      .mockRejectedValueOnce(ALREADY_CONFIRMED)
      .mockResolvedValueOnce(SENT);

    const answers = await Promise.all([
      service.resendConfirmationCode('nobody@example.com'),
      service.resendConfirmationCode('confirmed@example.com'),
      service.resendConfirmationCode('unconfirmed@example.com'),
    ]);

    expect(new Set(answers).size).toBe(1);
  });

  it('answers forgot-password-code identically whether or not the account exists', async () => {
    aws.triggerForgotPassword
      .mockRejectedValueOnce(NOT_REGISTERED)
      .mockResolvedValueOnce(SENT);

    const answers = await Promise.all([
      service.triggerForgotPassword('nobody@example.com'),
      service.triggerForgotPassword('real@example.com'),
    ]);

    expect(new Set(answers).size).toBe(1);
  });

  it('does not reveal whether a failed login was a bad address or a bad password', async () => {
    aws.loginUser
      .mockRejectedValueOnce(NOT_REGISTERED)
      .mockRejectedValueOnce(
        Object.assign(new Error('Incorrect username or password.'), {
          name: 'NotAuthorizedException',
        }),
      );

    const errors = await Promise.all(
      ['nobody@example.com', 'real@example.com'].map((email) =>
        service
          .loginUser({ email, password: 'pw' } as any)
          .then(() => null)
          .catch((e) => `${e.getStatus()}:${e.message}`),
      ),
    );

    expect(new Set(errors).size).toBe(1);
    expect(errors[0]).toBe('401:Incorrect email or password');
  });
});
