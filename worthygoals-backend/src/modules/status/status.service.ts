import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusPost } from 'src/database/models/status-post.entity';
import { StatusReaction } from 'src/database/models/status-reaction.entity';
import { AiGatewayService } from 'src/core/ai/gateway/ai-gateway.service';
import { UsersService } from '../users/users.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { StatusPostDto } from './dto/status-post.dto';

/**
 * The polyphonic roster (Hi-Fi flow ⑤). `personalityId === slug` on the WG
 * runtime, so these ids drive both the YAML persona and the frontend avatar.
 * A status always fans out to one reaction per member, in order.
 */
const ROSTER: { personalityId: string; name: string; fallback: string }[] = [
  { personalityId: 'marcus', name: 'Marcus', fallback: 'Noted. What is next?' },
  {
    personalityId: 'lyra',
    name: 'Lyra',
    fallback: 'I hear you. Be gentle with yourself, then keep going.',
  },
  { personalityId: 'goggs', name: 'Goggs', fallback: 'STAY HARD. NO EXCUSES.' },
];

const STATUS_FEED_LIMIT = 50;

@Injectable()
export class StatusService {
  private readonly logger = new Logger(StatusService.name);

  constructor(
    @InjectRepository(StatusPost)
    private readonly statusRepo: Repository<StatusPost>,
    @InjectRepository(StatusReaction)
    private readonly reactionRepo: Repository<StatusReaction>,
    private readonly usersService: UsersService,
    private readonly gateway: AiGatewayService,
  ) {}

  async create(sub: string, dto: CreateStatusDto): Promise<StatusPostDto> {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');

    const post = await this.statusRepo.save(
      this.statusRepo.create({ userId: user.id, text: dto.text }),
    );

    // Fan out to every personality in parallel — the team reacts at once.
    const reactions = await Promise.all(
      ROSTER.map(async (member) => {
        const text = await this.generateReaction(
          user.id,
          member.personalityId,
          dto.text,
          member.fallback,
        );
        return this.reactionRepo.create({
          statusId: post.id,
          personalityId: member.personalityId,
          mentorName: member.name,
          text,
        });
      }),
    );

    await this.reactionRepo.save(reactions);

    return this.toDto(post, reactions);
  }

  async findAllForUser(sub: string): Promise<StatusPostDto[]> {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');

    const posts = await this.statusRepo.find({
      where: { userId: user.id },
      relations: { reactions: true },
      order: { createdAt: 'DESC' },
      take: STATUS_FEED_LIMIT,
    });

    return posts.map((post) =>
      this.toDto(post, this.orderReactions(post.reactions ?? [])),
    );
  }

  private async generateReaction(
    userId: number,
    personalityId: string,
    statusText: string,
    fallback: string,
  ): Promise<string> {
    try {
      const result = await this.gateway.chat({
        userId,
        feature: 'status',
        personalityId,
        event: 'status.reaction',
        messages: [{ role: 'user', content: statusText }],
      });
      const text = result.text?.trim();
      return text && text.length > 0 ? text : fallback;
    } catch (err: any) {
      // A flaky model must not block the post — fall back to a template line.
      this.logger.warn(
        `Status reaction for "${personalityId}" failed (${err?.message}); using fallback`,
      );
      return fallback;
    }
  }

  /** Keep reactions in roster order regardless of DB row order. */
  private orderReactions(reactions: StatusReaction[]): StatusReaction[] {
    const rank = new Map(ROSTER.map((m, i) => [m.personalityId, i]));
    return [...reactions].sort(
      (a, b) =>
        (rank.get(a.personalityId) ?? 99) - (rank.get(b.personalityId) ?? 99),
    );
  }

  private toDto(post: StatusPost, reactions: StatusReaction[]): StatusPostDto {
    return {
      id: post.id,
      text: post.text,
      createdAt: post.createdAt,
      reactions: reactions.map((r) => ({
        personalityId: r.personalityId,
        mentorName: r.mentorName,
        text: r.text,
      })),
    };
  }
}
