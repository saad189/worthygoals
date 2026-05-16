import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ConfigService } from '@nestjs/config';
import { JWT } from 'src/common/constants';
import { Request } from 'express';

@Injectable()
export class CognitoJwtStrategy extends PassportStrategy(Strategy, JWT) {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer: string;

  constructor(readonly configService: ConfigService) {
    super();

    const region = configService.get<string>('AWS_REGION');
    const userPoolId = configService.get<string>('AWS_COGNITO_USER_POOL_ID');
    this.issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    this.jwks = createRemoteJWKSet(
      new URL(`${this.issuer}/.well-known/jwks.json`),
    );
  }

  async validate(req: Request): Promise<any> {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const token = auth.slice(7);
    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: this.issuer,
      algorithms: ['RS256'],
    });

    if (!payload?.sub) {
      throw new UnauthorizedException();
    }
    return payload;
  }
}
