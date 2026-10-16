import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Socket } from 'socket.io';

/**
 * The global throttler, extended to Socket.IO events.
 *
 * It used to return `true` for every ws context, so `send_message` and
 * `joinConversation` had no rate limit at all — only the per-user AI quota
 * bounded cost, not socket or database churn. ThrottlerGuard needs an
 * HTTP-shaped req/res pair; this supplies one from the handshake.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext) {
    if (context.getType() !== 'ws') return super.getRequestResponse(context);

    const client = context.switchToWs().getClient<Socket>();
    return {
      req: { ip: clientIp(client), headers: client.handshake.headers },
      res: { header: () => undefined },
    };
  }
}

/**
 * Same rule as Express with `trust proxy` = 1 (main.ts): behind one proxy the
 * client is the last X-Forwarded-For hop, which the proxy itself appended.
 */
function clientIp(client: Socket): string {
  const xff = client.handshake.headers['x-forwarded-for'];
  const last = (Array.isArray(xff) ? xff.join(',') : (xff ?? ''))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .pop();
  return last ?? client.handshake.address;
}
