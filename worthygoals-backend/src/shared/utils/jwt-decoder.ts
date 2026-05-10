import { jwtDecode } from 'jwt-decode';
import { DecodedToken } from 'src/common/interfaces';

export function decodeJwtToken(token: string): DecodedToken {
  return jwtDecode<DecodedToken>(token);
}
