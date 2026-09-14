/**
 * Guards D7: the service must not throw from inside its own catch.
 *
 * generateSecretHash ran in the same try as the Cognito call, and
 * AWS_COGNITO_APP_CLIENT_SECRET is optional in env.validation. With no secret,
 * crypto.createHmac('SHA256', undefined) threw a bare TypeError carrying
 * neither .status nor .$metadata — and the catch read
 * error.$metadata.httpStatusCode unguarded, raising a second TypeError while
 * handling the first. A deployment that legitimately omitted the secret booted
 * clean and then failed every login with the original error erased.
 */
import { HttpException, UnauthorizedException } from '@nestjs/common';
import { AWSCognitoService } from '../aws-cognito.service';

describe('AWSCognitoService error normalisation', () => {
  const ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ENV,
      AWS_COGNITO_APP_CLIENT_ID: 'client-id',
      AWS_COGNITO_USER_POOL_ID: 'pool-id',
    };
    delete process.env.AWS_COGNITO_APP_CLIENT_SECRET;
  });

  afterAll(() => {
    process.env = ENV;
  });

  function serviceWithSendResult(result: Promise<unknown>) {
    const service = new AWSCognitoService();
    (service as any).cognitoClient = { send: jest.fn().mockReturnValue(result) };
    return service;
  }

  it('omits SECRET_HASH when no client secret is configured', async () => {
    const service = new AWSCognitoService();
    const send = jest.fn().mockResolvedValue({
      AuthenticationResult: { AccessToken: 'a', IdToken: 'b', RefreshToken: 'c' },
    });
    (service as any).cognitoClient = { send };

    await service.loginUser({ email: 'user@example.com', password: 'pw' } as any);

    const params = send.mock.calls[0][0].input.AuthParameters;
    expect(params).not.toHaveProperty('SECRET_HASH');
    expect(params.USERNAME).toBe('user@example.com');
  });

  it('turns a bare Error into an HttpException rather than throwing from the catch', async () => {
    const service = serviceWithSendResult(Promise.reject(new Error('boom')));

    await expect(
      service.loginUser({ email: 'user@example.com', password: 'pw' } as any),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('preserves the original message and defaults the status to 500', async () => {
    const service = serviceWithSendResult(Promise.reject(new Error('boom')));

    await service
      .loginUser({ email: 'user@example.com', password: 'pw' } as any)
      .catch((e: HttpException) => {
        expect(e.message).toBe('boom');
        expect(e.getStatus()).toBe(500);
      });
    expect.assertions(2);
  });

  it('uses the AWS $metadata status when present', async () => {
    const awsError: any = new Error('NotAuthorizedException');
    awsError.$metadata = { httpStatusCode: 401 };
    const service = serviceWithSendResult(Promise.reject(awsError));

    await service
      .loginUser({ email: 'user@example.com', password: 'pw' } as any)
      .catch((e: HttpException) => expect(e.getStatus()).toBe(401));
    expect.assertions(1);
  });

  it('rethrows an HttpException untouched', async () => {
    // No AuthenticationResult makes loginUser raise its own UnauthorizedException
    // inside the try; the catch must not rewrite its status to 500.
    const service = serviceWithSendResult(Promise.resolve({}));

    await service
      .loginUser({ email: 'user@example.com', password: 'pw' } as any)
      .catch((e: HttpException) => {
        expect(e).toBeInstanceOf(UnauthorizedException);
        expect(e.getStatus()).toBe(401);
      });
    expect.assertions(2);
  });
});
