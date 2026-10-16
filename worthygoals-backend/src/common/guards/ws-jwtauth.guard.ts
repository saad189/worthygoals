import { ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';
import { JWT } from 'src/common/constants';

@Injectable()
export class WsJwtAuthGuard extends AuthGuard(JWT) {
  getRequest(context: ExecutionContext) {
    const client = context.switchToWs().getClient();
    // socket.io client has a handshake with headers; passport-jwt reads Authorization
    const handshake = client.handshake;

    // handshake.auth only. A ?token= query parameter used to be accepted too,
    // which puts a live access token into proxy logs and history — and the
    // app never used it, so it only ever served someone else.
    const token = handshake?.auth?.token;

    if (token) {
      handshake.headers = handshake.headers ?? {};
      if (!handshake.headers.authorization) {
        handshake.headers.authorization = `Bearer ${token}`;
      }
    }

    return handshake;
  }

  // Over a socket only a WsException reaches the client as itself; an
  // UnauthorizedException became a generic "Internal server error", so the app
  // couldn't tell an expired token from a crash.
  handleRequest(err: any, user: any) {
    if (err && !(err instanceof HttpException)) throw err;
    if (err || !user) throw new WsException('Unauthorized');
    return user;
  }
}
