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
import { MessagesService } from './messages.service';
import { AgentService } from 'src/core/ai';
import { MessageResponseDto } from './dto/message-response.dto';

@WebSocketGateway({ namespace: '/messages', cors: true })
export class MessagesGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly agentService: AgentService,
  ) {}

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

  emitMentorTyping(conversationId: string) {
    this.server
      .to(this.roomForConversation(conversationId))
      .emit('mentorTyping', { conversationId });
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { conversationId?: string; text?: string; clientMessageId?: string },
  ) {
    const conversationId = body?.conversationId;
    const text = body?.text;
    if (!conversationId) throw new WsException('conversationId is required');
    if (!text || typeof text !== 'string')
      throw new WsException('text is required');

    const sub = (client.handshake as any)?.user?.sub;
    if (!sub) throw new WsException('Unauthorized');

    // 1) Save user message
    const userMessage = await this.messagesService.sendUserTextMessage({
      sub,
      dto: {
        conversationId,
        text,
        clientMessageId: body?.clientMessageId,
      },
    });

    const userPayload = MessageResponseDto.fromEntity(userMessage);
    this.emitMessageCreated(conversationId, userPayload);

    // 2) Signal mentor is composing before the AI call
    this.emitMentorTyping(conversationId);

    // 3) Generate agent reply
    if (!userMessage.userId) {
      throw new WsException('User message missing userId');
    }

    const reply = await this.agentService.generateMentorReply({
      conversationId,
      userId: userMessage.userId,
    });

    // 4) Save mentor message
    const mentorMessage = await this.messagesService.createMentorTextMessage({
      conversationId,
      text: reply.replyText,
      tokensIn: reply.tokensIn,
      tokensOut: reply.tokensOut,
    });

    const mentorPayload = MessageResponseDto.fromEntity(mentorMessage);
    this.emitMessageCreated(conversationId, mentorPayload);

    return {
      ok: true,
      userMessageId: userMessage.id,
      mentorMessageId: mentorMessage.id,
    };
  }
}
