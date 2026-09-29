import type { Request } from 'express';

export interface DecodedToken {
  username: string;
  email?: string;
  exp: number;
  iat: number;
  sub: string;
}

/** The verified Cognito access-token claims CognitoJwtStrategy puts on req.user. */
export interface CognitoAccessClaims {
  sub: string;
  token_use: 'access';
  client_id: string;
  username?: string;
  exp?: number;
  iat?: number;
}

/**
 * The request every JwtAuthGuard-protected handler receives.
 *
 * `@Request() req` was untyped at 35 controller sites, so `req.user.sub` — a
 * Cognito UUID — flowed unchecked into parameters typed `userId: number`
 * (the push-token bug). Typing the boundary once makes that a compile error.
 */
export type AuthenticatedRequest = Request & { user: CognitoAccessClaims };
