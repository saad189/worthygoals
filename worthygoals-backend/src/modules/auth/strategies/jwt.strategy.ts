import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { JWT } from 'src/common/constants';

@Injectable()
export class CognitoJwtStrategy extends PassportStrategy(Strategy, JWT) {
  constructor(readonly configService: ConfigService) {
    super({
      // Extract the JWT from the Authorization header as a Bearer token.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Dynamically retrieve the public key from AWS Cognito’s JWKS endpoint.
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true, // cache the downloaded keys for performance
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://cognito-idp.${configService.get<string>(
          'AWS_REGION',
        )}.amazonaws.com/${configService.get<string>(
          'AWS_COGNITO_USER_POOL_ID',
        )}/.well-known/jwks.json`,
      }),

      // Validate the token’s issuer
      issuer: `https://cognito-idp.${configService.get<string>(
        'AWS_REGION',
      )}.amazonaws.com/${configService.get<string>('AWS_COGNITO_USER_POOL_ID')}`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    if (!payload || typeof payload.sub !== 'string' || !payload.sub) {
      throw new UnauthorizedException();
    }

    // Additional validation logic can be added here.
    return payload;
  }
}
