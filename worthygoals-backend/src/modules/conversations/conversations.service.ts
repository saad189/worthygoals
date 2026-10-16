import { parseLimit } from 'src/common/pagination';
import { rethrowSafe } from 'src/common/errors/rethrow-safe';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from 'src/database/models/conversation.entity';
import { Message } from 'src/database/models/message.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class ConversationsService {
  private logger = new Logger(ConversationsService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly usersService: UsersService,
  ) {}

  // `messages`, `messages.*`, `summaries` and `memoryItems` joined the user's
  // entire history into one response — the chat list asked for `messages` on
  // every load just to show a preview line. `lastMessage` returns only that
  // line (as a one-element `messages` array, so the response shape holds);
  // full history is the paginated GET /messages.
  private static readonly allowedIncludePaths = new Set([
    'mentor',
    'user',
    'lastMessage',
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
    return {
      ...(includes.has('mentor') ? { mentor: true } : {}),
      ...(includes.has('user') ? { user: true } : {}),
    };
  }

  /** One query for the newest message of each conversation. */
  private async attachLastMessages(conversations: Conversation[]) {
    if (!conversations.length) return;
    const latest = await this.messageRepository
      .createQueryBuilder('m')
      .distinctOn(['m.conversationId'])
      .where('m.conversationId IN (:...ids)', {
        ids: conversations.map((c) => c.id),
      })
      .orderBy('m.conversationId')
      .addOrderBy('m.createdAt', 'DESC')
      .addOrderBy('m.id', 'DESC')
      .getMany();
    const byConversation = new Map(latest.map((m) => [m.conversationId, m]));
    for (const c of conversations) {
      const last = byConversation.get(c.id);
      c.messages = last ? [last] : [];
    }
  }

  async findAll(params: {
    sub: string;
    mentorId?: number;
    include?: string | string[];
    limit?: string;
  }): Promise<Conversation[]> {
    try {
      const user = await this.usersService.findByAccountSub(params.sub);
      if (!user) {
        throw new BadRequestException(
          'User profile not found for this token. Create your user profile first.',
        );
      }

      const conversations = await this.conversationRepository.find({
        where: {
          userId: user.id,
          ...(params.mentorId ? { mentorId: params.mentorId } : {}),
        },
        relations: this.buildRelations(params.include),
        order: {
          lastMessageAt: 'DESC',
          createdAt: 'DESC',
        },
        take: parseLimit(params.limit, { fallback: 50, max: 100 }),
      });
      if (this.normalizeInclude(params.include).includes('lastMessage')) {
        await this.attachLastMessages(conversations);
      }
      return conversations;
    } catch (error) {
      rethrowSafe(
        error,
        this.logger,
        `${ConversationsService.name}:${this.findAll.name}`,
      );
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
      if (
        conversation &&
        this.normalizeInclude(params.include).includes('lastMessage')
      ) {
        await this.attachLastMessages([conversation]);
      }

      if (!conversation)
        throw new NotFoundException(
          `Conversation with id: ${params.id} not found.`,
        );

      return conversation;
    } catch (error) {
      rethrowSafe(
        error,
        this.logger,
        `${ConversationsService.name}:${this.findOne.name}`,
      );
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
      rethrowSafe(
        error,
        this.logger,
        `${ConversationsService.name}:${this.create.name}`,
      );
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
      rethrowSafe(
        error,
        this.logger,
        `${ConversationsService.name}:${this.update.name}`,
      );
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
      rethrowSafe(
        error,
        this.logger,
        `${ConversationsService.name}:${this.remove.name}`,
      );
    }
  }
}
