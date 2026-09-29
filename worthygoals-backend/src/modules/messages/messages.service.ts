import { rethrowSafe } from 'src/common/errors/rethrow-safe';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parseLimit } from 'src/common/pagination';
import { Conversation } from 'src/database/models/conversation.entity';
import { Message } from 'src/database/models/message.entity';
import { MessageContentType, MessageRole } from 'src/common/constants';
import { SendTextMessageDto } from './dto/send-text-message.dto';
import { UsersService } from 'src/modules/users/users.service';
import { MemoryService } from 'src/core/memory/memory.service';

@Injectable()
export class MessagesService {
  private logger = new Logger(MessagesService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    private readonly usersService: UsersService,
    @Optional() private readonly memoryService?: MemoryService,
  ) {
    if (!this.memoryService) {
      this.logger.warn(
        'MemoryService not injected — chat messages will not be indexed into memory',
      );
    }
  }

  async list(params: {
    conversationId: string;
    sub: string;
    limit?: string;
    before?: Date;
    beforeId?: string;
  }): Promise<Message[]> {
    try {
      const [user, conversation] = await Promise.all([
        this.usersService.findByAccountSub(params.sub),
        this.conversationRepository.findOne({
          where: { id: params.conversationId },
          select: { id: true, userId: true },
        }),
      ]);

      if (!user) {
        throw new BadRequestException(
          'User profile not found for this token. Create your user profile first.',
        );
      }

      if (!conversation) {
        throw new NotFoundException(
          `Conversation with id: ${params.conversationId} not found.`,
        );
      }

      if (conversation.userId !== user.id) {
        throw new ForbiddenException('Cannot access other users messages');
      }

      const take = parseLimit(params.limit, { fallback: 50, max: 200 });

      const qb = this.messageRepository
        .createQueryBuilder('m')
        .where('m.conversationId = :conversationId', {
          conversationId: params.conversationId,
        })
        .orderBy('m.createdAt', 'DESC')
        .addOrderBy('m.id', 'DESC')
        .take(take);

      // Paging on createdAt alone skipped or repeated a message whenever two
      // shared a timestamp across a page boundary. (createdAt, id) is a total
      // order; beforeId is the id of the oldest message the client holds.
      if (params.before && params.beforeId) {
        qb.andWhere('(m.createdAt, m.id) < (:before, :beforeId)', {
          before: params.before,
          beforeId: params.beforeId,
        });
      } else if (params.before) {
        qb.andWhere('m.createdAt < :before', { before: params.before });
      }

      const results = await qb.getMany();

      return results.reverse();
    } catch (error) {
      rethrowSafe(
        error,
        this.logger,
        `${MessagesService.name}:${this.list.name}`,
      );
    }
  }

  /**
   * Resolves sub -> user.id and confirms the conversation belongs to them.
   *
   * The single chokepoint for conversation ownership. It was inline in
   * sendUserTextMessage only, so the gateway's joinConversation joined any
   * supplied conversation id unchecked — and the room it joins receives
   * messageChunk, i.e. a live read of another user's private mentor chat.
   */
  async assertConversationOwnership(params: {
    sub: string;
    conversationId: string;
  }): Promise<{ userId: number; conversationId: string }> {
    const [user, conversation] = await Promise.all([
      this.usersService.findByAccountSub(params.sub),
      this.conversationRepository.findOne({
        where: { id: params.conversationId },
        select: { id: true, userId: true },
      }),
    ]);

    if (!user) {
      throw new BadRequestException(
        'User profile not found for this token. Create your user profile first.',
      );
    }

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with id: ${params.conversationId} not found.`,
      );
    }

    if (conversation.userId !== user.id) {
      throw new ForbiddenException('Cannot access this conversation');
    }

    return { userId: user.id, conversationId: conversation.id };
  }

  async sendUserTextMessage(params: {
    sub: string;
    dto: SendTextMessageDto;
  }): Promise<Message> {
    try {
      const { userId, conversationId } = await this.assertConversationOwnership(
        {
          sub: params.sub,
          conversationId: params.dto.conversationId,
        },
      );

      const message = this.messageRepository.create({
        conversationId,
        role: MessageRole.USER,
        userId,
        mentorId: null,
        contentType: MessageContentType.TEXT,
        text: params.dto.text,
        content: null,
        clientMessageId: params.dto.clientMessageId ?? null,
        replyToMessageId: null,
        tokensIn: null,
        tokensOut: null,
        safetyFlags: null,
        archivedAt: null,
      });

      const saved = await this.messageRepository.save(message);

      await this.conversationRepository.update(conversationId, {
        lastMessageAt: saved.createdAt,
        lastMessageId: saved.id,
      });

      if (params.dto.text) {
        this.memoryService?.indexMessage(userId, saved.id, params.dto.text);
      }

      return saved;
    } catch (error) {
      rethrowSafe(
        error,
        this.logger,
        `${MessagesService.name}:${this.sendUserTextMessage.name}`,
      );
    }
  }

  async createMentorTextMessage(params: {
    conversationId: string;
    text: string;
    tokensIn?: number | null;
    tokensOut?: number | null;
  }): Promise<Message> {
    try {
      const conversation = await this.conversationRepository.findOne({
        where: { id: params.conversationId },
        select: { id: true, mentorId: true },
      });

      if (!conversation) {
        throw new NotFoundException(
          `Conversation with id: ${params.conversationId} not found.`,
        );
      }

      const message = this.messageRepository.create({
        conversationId: conversation.id,
        role: MessageRole.MENTOR,
        userId: null,
        mentorId: conversation.mentorId,
        contentType: MessageContentType.TEXT,
        text: params.text,
        content: null,
        clientMessageId: null,
        replyToMessageId: null,
        tokensIn: params.tokensIn ?? null,
        tokensOut: params.tokensOut ?? null,
        safetyFlags: null,
        archivedAt: null,
      });

      const saved = await this.messageRepository.save(message);

      await this.conversationRepository.update(conversation.id, {
        lastMessageAt: saved.createdAt,
        lastMessageId: saved.id,
      });

      return saved;
    } catch (error) {
      rethrowSafe(
        error,
        this.logger,
        `${MessagesService.name}:${this.createMentorTextMessage.name}`,
      );
    }
  }
}
