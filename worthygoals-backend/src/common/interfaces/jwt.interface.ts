export interface DecodedToken {
  username: string;
  email?: string;
  exp: number;
  iat: number;
  sub: string;
}
