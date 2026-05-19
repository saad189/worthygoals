import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
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
  ) {}

  async list(params: {
    conversationId: string;
    sub: string;
    limit?: number;
    before?: Date;
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

      const take = params.limit ?? 50;
      if (!Number.isFinite(take) || take <= 0 || take > 200) {
        throw new BadRequestException('limit must be between 1 and 200');
      }

      const where: any = {
        conversationId: params.conversationId,
      };

      if (params.before) {
        where.createdAt = LessThan(params.before);
      }

      const results = await this.messageRepository.find({
        where,
        order: { createdAt: 'DESC' },
        take,
      });

      return results.reverse();
    } catch (error) {
      this.logger.log(
        `${MessagesService.name}:${this.list.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async sendUserTextMessage(params: {
    sub: string;
    dto: SendTextMessageDto;
  }): Promise<Message> {
    try {
      const [user, conversation] = await Promise.all([
        this.usersService.findByAccountSub(params.sub),
        this.conversationRepository.findOne({
          where: { id: params.dto.conversationId },
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
          `Conversation with id: ${params.dto.conversationId} not found.`,
        );
      }

      if (conversation.userId !== user.id) {
        throw new ForbiddenException(
          'Cannot send messages to this conversation',
        );
      }

      const message = this.messageRepository.create({
        conversationId: conversation.id,
        role: MessageRole.USER,
        userId: user.id,
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

      await this.conversationRepository.update(conversation.id, {
        lastMessageAt: saved.createdAt,
        lastMessageId: saved.id,
      });

      if (params.dto.text) {
        this.memoryService?.indexMessage(user.id, saved.id, params.dto.text);
      }

      return saved;
    } catch (error) {
      this.logger.log(
        `${MessagesService.name}:${this.sendUserTextMessage.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
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
      this.logger.log(
        `${MessagesService.name}:${this.createMentorTextMessage.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }
}
