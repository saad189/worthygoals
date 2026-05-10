import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT } from 'src/common/constants';

@Injectable()
export class WsJwtAuthGuard extends AuthGuard(JWT) {
  getRequest(context: ExecutionContext) {
    const client = context.switchToWs().getClient();
    // socket.io client has a handshake with headers; passport-jwt reads Authorization
    const handshake = client.handshake;

    const tokenFromAuth = handshake?.auth?.token;
    const tokenFromQuery = handshake?.query?.token;
    const token = tokenFromAuth || tokenFromQuery;

    if (token) {
      handshake.headers = handshake.headers ?? {};
      if (!handshake.headers.authorization) {
        handshake.headers.authorization = `Bearer ${token}`;
      }
    }

    return handshake;
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Unauthorized, Invalid token!');
    }
    return user;
  }
}
