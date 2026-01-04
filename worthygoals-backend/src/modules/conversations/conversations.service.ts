import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from 'src/database/models/conversation.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class ConversationsService {
  private logger = new Logger(ConversationsService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    private readonly usersService: UsersService,
  ) {}

  private static readonly allowedIncludePaths = new Set([
    'mentor',
    'user',
    'messages',
    'messages.attachments',
    'messages.feedback',
    'summaries',
    'memoryItems',
  ]);

  private normalizeInclude(include?: string | string[]): string[] {
    if (!include) return [];

    const raw = Array.isArray(include) ? include : [include];
    const parts = raw
      .flatMap((v) => v.split(','))
      .map((v) => v.trim())
      .filter(Boolean);

    const unique = Array.from(new Set(parts));
    const invalid = unique.filter(
      (p) => !ConversationsService.allowedIncludePaths.has(p),
    );

    if (invalid.length) {
      throw new BadRequestException(
        `Invalid include relation(s): ${invalid.join(', ')}. Allowed: ${Array.from(
          ConversationsService.allowedIncludePaths,
        ).join(', ')}`,
      );
    }

    return unique;
  }

  private buildRelations(include?: string | string[]) {
    const includes = new Set(this.normalizeInclude(include));
    const relations: any = {};

    if (includes.has('mentor')) relations.mentor = true;
    if (includes.has('user')) relations.user = true;

    if (
      includes.has('messages') ||
      includes.has('messages.attachments') ||
      includes.has('messages.feedback')
    ) {
      relations.messages = relations.messages ?? {};
      if (includes.has('messages'))
        relations.messages = relations.messages || true;
      if (includes.has('messages.attachments'))
        relations.messages.attachments = true;
      if (includes.has('messages.feedback')) relations.messages.feedback = true;
    }

    if (includes.has('summaries')) relations.summaries = true;
    if (includes.has('memoryItems')) relations.memoryItems = true;

    return relations;
  }

  async findAll(params: {
    sub: string;
    mentorId?: number;
    include?: string | string[];
  }): Promise<Conversation[]> {
    try {
      const user = await this.usersService.findByAccountSub(params.sub);
      if (!user) {
        throw new BadRequestException(
          'User profile not found for this token. Create your user profile first.',
        );
      }

      return await this.conversationRepository.find({
        where: {
          userId: user.id,
          ...(params.mentorId ? { mentorId: params.mentorId } : {}),
        },
        relations: this.buildRelations(params.include),
        order: {
          lastMessageAt: 'DESC',
          createdAt: 'DESC',
        },
      });
    } catch (error) {
      this.logger.log(
        `${ConversationsService.name}:${this.findAll.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async findOne(params: {
    id: string;
    sub: string;
    include?: string | string[];
  }): Promise<Conversation> {
    try {
      const user = await this.usersService.findByAccountSub(params.sub);
      if (!user) {
        throw new BadRequestException(
          'User profile not found for this token. Create your user profile first.',
        );
      }
      const conversation = await this.conversationRepository.findOne({
        where: { id: params.id, userId: user.id },
        relations: this.buildRelations(params.include),
      });

      if (!conversation)
        throw new NotFoundException(
          `Conversation with id: ${params.id} not found.`,
        );

      return conversation;
    } catch (error) {
      this.logger.log(
        `${ConversationsService.name}:${this.findOne.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async create(params: {
    sub: string;
    dto: CreateConversationDto;
  }): Promise<Conversation> {
    try {
      if (!params.dto.mentorId) {
        throw new BadRequestException('mentorId is required');
      }
      const user = await this.usersService.findByAccountSub(params.sub);
      if (!user) {
        throw new BadRequestException(
          'User profile not found for this token. Create your user profile first.',
        );
      }
      // Prevent duplicate conversations per user+mentor
      const existing = await this.conversationRepository.findOne({
        where: {
          userId: user.id,
          mentorId: params.dto.mentorId,
        },
      });
      if (existing) return existing;

      const conversation = this.conversationRepository.create({
        userId: user.id,
        mentorId: params.dto.mentorId,
        title: params.dto.title ?? null,
        metadata: params.dto.metadata ?? null,
      });

      return await this.conversationRepository.save(conversation);
    } catch (error) {
      this.logger.log(
        `${ConversationsService.name}:${this.create.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async update(params: {
    id: string;
    sub: string;
    dto: UpdateConversationDto;
  }): Promise<Conversation> {
    try {
      const user = await this.usersService.findByAccountSub(params.sub);
      if (!user) {
        throw new BadRequestException(
          'User profile not found for this token. Create your user profile first.',
        );
      }
      // Disallow changing mentorId/userId via update
      if ((params.dto as any).mentorId !== undefined) {
        throw new BadRequestException('mentorId cannot be updated');
      }

      const conversation = await this.conversationRepository.findOne({
        where: { id: params.id, userId: user.id },
      });

      if (!conversation)
        throw new NotFoundException(
          `Conversation with id: ${params.id} not found.`,
        );

      this.conversationRepository.merge(conversation, {
        title: params.dto.title ?? conversation.title,
        metadata:
          params.dto.metadata === undefined
            ? conversation.metadata
            : params.dto.metadata,
        status: params.dto.status ?? conversation.status,
      });

      return await this.conversationRepository.save(conversation);
    } catch (error) {
      this.logger.log(
        `${ConversationsService.name}:${this.update.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }

  async remove(params: { id: string; sub: string }): Promise<void> {
    try {
      const user = await this.usersService.findByAccountSub(params.sub);
      if (!user) {
        throw new BadRequestException(
          'User profile not found for this token. Create your user profile first.',
        );
      }
      const conversation = await this.conversationRepository.findOne({
        where: { id: params.id, userId: user.id },
      });

      if (!conversation)
        throw new NotFoundException(
          `Conversation with id: ${params.id} not found.`,
        );

      await this.conversationRepository.remove(conversation);
    } catch (error) {
      this.logger.log(
        `${ConversationsService.name}:${this.remove.name}: ${JSON.stringify(error.message)}`,
      );
      throw new HttpException(error.message, error.status);
    }
  }
}
