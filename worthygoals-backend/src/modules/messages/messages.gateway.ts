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
import { SafetyService } from 'src/core/safety/safety.service';
import { MessageResponseDto } from './dto/message-response.dto';

@WebSocketGateway({ namespace: '/messages', cors: true })
export class MessagesGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly agentService: AgentService,
    private readonly safetyService: SafetyService,
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

  emitMessageChunk(conversationId: string, chunk: string) {
    this.server
      .to(this.roomForConversation(conversationId))
      .emit('messageChunk', { conversationId, chunk });
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

    // 2) Safety gate — crisis signals bypass AI entirely
    if (this.safetyService.isCrisisSignal(text)) {
      const crisisMessage = await this.messagesService.createMentorTextMessage({
        conversationId,
        text: this.safetyService.getCrisisResponse(),
        tokensIn: null,
        tokensOut: null,
      });
      this.emitMessageCreated(
        conversationId,
        MessageResponseDto.fromEntity(crisisMessage),
      );
      return {
        ok: true,
        userMessageId: userMessage.id,
        mentorMessageId: crisisMessage.id,
      };
    }

    // 3) Signal mentor is composing before streaming starts
    this.emitMentorTyping(conversationId);

    // 4) Generate agent reply with token streaming
    if (!userMessage.userId) {
      throw new WsException('User message missing userId');
    }

    const reply = await this.agentService.generateMentorReply({
      conversationId,
      userId: userMessage.userId,
      onChunk: (chunk) => this.emitMessageChunk(conversationId, chunk),
    });

    // 5) Save complete mentor message and emit final event
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
