import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ConfigService } from '@nestjs/config';
import { JWT } from 'src/common/constants';
import { Request } from 'express';
import { CognitoAccessClaims } from 'src/common/interfaces';

@Injectable()
export class CognitoJwtStrategy extends PassportStrategy(Strategy, JWT) {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer: string;
  private readonly clientId: string;

  constructor(readonly configService: ConfigService) {
    super();

    const region = configService.get<string>('AWS_REGION');
    const userPoolId = configService.get<string>('AWS_COGNITO_USER_POOL_ID');
    this.issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    this.clientId = configService.get<string>(
      'AWS_COGNITO_APP_CLIENT_ID',
    ) as string;
    this.jwks = createRemoteJWKSet(
      new URL(`${this.issuer}/.well-known/jwks.json`),
    );
  }

  async validate(req: Request): Promise<CognitoAccessClaims> {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const token = auth.slice(7);
    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: this.issuer,
      algorithms: ['RS256'],
    });

    // Cognito signs ID and access tokens with the same keys under the same
    // issuer, and every app client in the pool shares the JWKS. Signature and
    // issuer alone therefore accepted an ID token, or an access token minted
    // for a different app client. Access tokens carry client_id, not aud.
    if (
      !payload?.sub ||
      payload.token_use !== 'access' ||
      payload.client_id !== this.clientId
    ) {
      throw new UnauthorizedException();
    }
    return payload as unknown as CognitoAccessClaims;
  }
}
