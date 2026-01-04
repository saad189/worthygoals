import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtAuthGuard } from 'src/common/guards/ws-jwtauth.guard';

@WebSocketGateway({ namespace: '/messages', cors: true })
export class MessagesGateway {
  @WebSocketServer()
  server!: Server;

  private roomForConversation(conversationId: string) {
    return `conversation:${conversationId}`;
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('joinConversation')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string },
  ) {
    const conversationId = body?.conversationId;
    if (!conversationId) throw new WsException('conversationId is required');

    await client.join(this.roomForConversation(conversationId));

    return { ok: true };
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('leaveConversation')
  async leaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string },
  ) {
    const conversationId = body?.conversationId;
    if (!conversationId) throw new WsException('conversationId is required');

    await client.leave(this.roomForConversation(conversationId));

    return { ok: true };
  }

  emitMessageCreated(conversationId: string, message: unknown) {
    this.server
      .to(this.roomForConversation(conversationId))
      .emit('messageCreated', message);
  }
}
