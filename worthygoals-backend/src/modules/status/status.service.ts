import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { parseLimit } from 'src/common/pagination';
import { StatusPost } from 'src/database/models/status-post.entity';
import { StatusReaction } from 'src/database/models/status-reaction.entity';
import { AiGatewayService } from 'src/core/ai/gateway/ai-gateway.service';
import { MediaService } from '../media/media.service';
import { UsersService } from '../users/users.service';
import { SafetyService } from 'src/core/safety/safety.service';
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
    private readonly mediaService: MediaService,
    private readonly safetyService: SafetyService,
  ) {}

  async create(sub: string, dto: CreateStatusDto): Promise<StatusPostDto> {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');

    // A status in crisis gets the audited safe response, never three persona
    // replies. Chat and task completion already had this gate; status did not.
    const crisis = this.safetyService.isCrisisSignal(dto.text);

    // The AI calls run first, outside any transaction (they take seconds).
    // The post and its reactions then commit together: previously the post
    // was saved before the fan-out, so a crash in between left a permanently
    // silent post with no way to repair it.
    const reactionDrafts = crisis
      ? []
      : await Promise.all(
          ROSTER.map(async (member) => ({
            personalityId: member.personalityId,
            mentorName: member.name,
            text: await this.generateReaction(
              user.id,
              member.personalityId,
              dto.text,
              member.fallback,
            ),
          })),
        );

    const { post, reactions } = await this.statusRepo.manager.transaction(
      async (em) => {
        const saved = await em.save(
          em.create(StatusPost, {
            userId: user.id,
            text: dto.text,
            mediaId: dto.mediaId ?? null,
          }),
        );
        const savedReactions = await em.save(
          reactionDrafts.map((r) =>
            em.create(StatusReaction, { ...r, statusId: saved.id }),
          ),
        );
        // Photo uploaded through the presign path — mark the draft attached
        // so it isn't collectable as an orphan.
        if (dto.mediaId) {
          await this.mediaService.markAttached(dto.mediaId, sub, em);
        }
        return { post: saved, reactions: savedReactions };
      },
    );

    const result = await this.toDto(post, reactions);
    return crisis
      ? {
          ...result,
          safetyFlag: true,
          crisisResponse: this.safetyService.getCrisisResponse(),
        }
      : result;
  }

  async findAllForUser(
    sub: string,
    page: { limit?: string; before?: Date } = {},
  ): Promise<StatusPostDto[]> {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');

    // Capped at STATUS_FEED_LIMIT with no way past it; `before` (the oldest
    // createdAt the client holds) is the cursor for the next page.
    const posts = await this.statusRepo.find({
      where: {
        userId: user.id,
        ...(page.before ? { createdAt: LessThan(page.before) } : {}),
      },
      relations: { reactions: true },
      order: { createdAt: 'DESC' },
      take: parseLimit(page.limit, {
        fallback: STATUS_FEED_LIMIT,
        max: STATUS_FEED_LIMIT,
      }),
    });

    return Promise.all(
      posts.map((post) =>
        this.toDto(post, this.orderReactions(post.reactions ?? [])),
      ),
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

  private async toDto(
    post: StatusPost,
    reactions: StatusReaction[],
  ): Promise<StatusPostDto> {
    // Same pattern as the board: resolve the media draft to a presigned GET
    // url on read; null when there's no photo or S3 isn't configured.
    const imageUrl = post.mediaId
      ? await this.mediaService.getPresignedGetUrl(post.mediaId, post.userId)
      : null;

    return {
      id: post.id,
      text: post.text,
      createdAt: post.createdAt,
      imageUrl,
      reactions: reactions.map((r) => ({
        personalityId: r.personalityId,
        mentorName: r.mentorName,
        text: r.text,
      })),
    };
  }
}
