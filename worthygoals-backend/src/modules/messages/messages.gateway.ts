import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtAuthGuard } from 'src/common/guards/ws-jwtauth.guard';
import { MessagesService } from './messages.service';
import { AgentService } from 'src/core/ai';
import { SafetyService } from 'src/core/safety/safety.service';
import { MessageResponseDto } from './dto/message-response.dto';
import { corsOrigin } from 'src/common/cors';
import { CognitoAccessClaims } from 'src/common/interfaces';

/** WsJwtAuthGuard puts the verified claims on the handshake. */
const subOf = (client: Socket) =>
  (client.handshake as { user?: CognitoAccessClaims }).user?.sub;

@WebSocketGateway({
  namespace: '/messages',
  cors: { origin: corsOrigin, credentials: true },
})
export class MessagesGateway {
  private readonly logger = new Logger(MessagesGateway.name);

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

    const sub = subOf(client);
    if (!sub) throw new WsException('Unauthorized');

    // The room receives messageChunk and messageCreated. Joining it unchecked
    // was a live read of another user's private mentor chat.
    await this.messagesService.assertConversationOwnership({
      sub,
      conversationId,
    });

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

    const sub = subOf(client);
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

    // Everything from here runs after the typing indicator is already on the
    // client. An error thrown raw becomes Nest's generic "Internal server
    // error", which the user cannot tell apart from the app being broken —
    // and hitting the 20/day free-tier quota is routine, not a fault.
    let reply: Awaited<
      ReturnType<typeof this.agentService.generateMentorReply>
    >;
    try {
      reply = await this.agentService.generateMentorReply({
        conversationId,
        userId: userMessage.userId,
        onChunk: (chunk) => this.emitMessageChunk(conversationId, chunk),
      });
    } catch (error: any) {
      this.logger.error(
        `Mentor reply failed for conversation ${conversationId}: ${error?.message}`,
      );
      throw new WsException(
        error?.code === 'quota_exceeded'
          ? "You've reached today's message limit with your mentor. It resets tomorrow."
          : 'Your mentor could not reply just now. Please try again.',
      );
    }

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
