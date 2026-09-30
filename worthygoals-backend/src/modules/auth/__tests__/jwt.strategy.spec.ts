const mockJwtVerify = jest.fn();
jest.mock('jose', () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: (...args: unknown[]) => mockJwtVerify(...args),
}));

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { CognitoJwtStrategy } from '../strategies/jwt.strategy';

const CLIENT_ID = 'app-client';
const config = {
  get: (k: string) =>
    ({
      AWS_REGION: 'eu-north-1',
      AWS_COGNITO_USER_POOL_ID: 'pool',
      AWS_COGNITO_APP_CLIENT_ID: CLIENT_ID,
    })[k],
} as unknown as ConfigService;

const req = { headers: { authorization: 'Bearer t' } } as Request;
const claims = (o = {}) => ({
  payload: { sub: 'u1', token_use: 'access', client_id: CLIENT_ID, ...o },
});

describe('CognitoJwtStrategy', () => {
  const strategy = new CognitoJwtStrategy(config);

  it('accepts an access token for this app client', async () => {
    mockJwtVerify.mockResolvedValue(claims());
    await expect(strategy.validate(req)).resolves.toMatchObject({ sub: 'u1' });
  });

  it('rejects an ID token signed by the same pool', async () => {
    mockJwtVerify.mockResolvedValue(claims({ token_use: 'id' }));
    await expect(strategy.validate(req)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an access token minted for another app client', async () => {
    mockJwtVerify.mockResolvedValue(claims({ client_id: 'other-client' }));
    await expect(strategy.validate(req)).rejects.toThrow(UnauthorizedException);
  });
});
