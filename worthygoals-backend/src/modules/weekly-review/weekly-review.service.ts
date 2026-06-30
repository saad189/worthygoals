import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from 'src/database/models';
import { GoalStatus } from 'src/common/constants';
import { AiGatewayService } from 'src/core/ai/gateway/ai-gateway.service';
import { UsersService } from '../users/users.service';
import {
  GoalWeekRowDto,
  WeeklyReviewDto,
  WeekTrend,
} from './dto/weekly-review.dto';

/**
 * Per-mentor fallback commentary, keyed by trend, used when the AI path is
 * unavailable so the weekly review always renders. `personalityId === slug` on
 * the WG roster, so the same id drives the YAML persona and the frontend avatar.
 */
const FALLBACK: Record<string, Record<WeekTrend, string>> = {
  marcus: {
    up: 'More than last week. Hold the line.',
    flat: 'Steady. Steadiness is its own discipline.',
    down: 'Fewer than last week. Account for it, then move.',
  },
  lyra: {
    up: 'You showed up more this week — feel that.',
    flat: 'A steady week. That counts too.',
    down: 'A quieter week. Be gentle, then begin again.',
  },
  goggs: {
    up: 'MORE REPS. KEEP STACKING.',
    flat: 'SAME AS LAST WEEK. NOT ENOUGH. PUSH.',
    down: 'YOU SLIPPED. NO EXCUSES. GET BACK ON IT.',
  },
};

const DEFAULT_PERSONALITY = 'marcus';
const DEFAULT_MENTOR_NAME = 'Marcus';

@Injectable()
export class WeeklyReviewService {
  private readonly logger = new Logger(WeeklyReviewService.name);

  constructor(
    @InjectRepository(Goal) private readonly goalRepo: Repository<Goal>,
    private readonly usersService: UsersService,
    private readonly gateway: AiGatewayService,
  ) {}

  async getReview(sub: string): Promise<WeeklyReviewDto> {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');

    const weekStart = this.startOfWeek(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7); // exclusive upper bound
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const goals = await this.goalRepo.find({
      where: { userId: user.id, status: GoalStatus.ACTIVE },
      relations: ['tasks', 'tasks.completions', 'mentor'],
      order: { createdAt: 'DESC' },
    });

    const rows = await Promise.all(
      goals.map((goal) =>
        this.buildRow(user.id, goal, weekStart, weekEnd, lastWeekStart),
      ),
    );

    const onTrackCount = rows.filter((r) => !r.danger).length;
    const weekEndInclusive = new Date(weekEnd.getTime() - 1);

    return {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEndInclusive.toISOString(),
      weekNumber: this.isoWeekNumber(weekStart),
      onTrackCount,
      totalGoals: rows.length,
      goals: rows,
    };
  }

  private async buildRow(
    userId: number,
    goal: Goal,
    weekStart: Date,
    weekEnd: Date,
    lastWeekStart: Date,
  ): Promise<GoalWeekRowDto> {
    const completionDates = (goal.tasks ?? []).flatMap((t) =>
      (t.completions ?? []).map((c) => new Date(c.createdAt)),
    );

    const inRange = (d: Date, lo: Date, hi: Date) => d >= lo && d < hi;
    const thisWeekCount = completionDates.filter((d) =>
      inRange(d, weekStart, weekEnd),
    ).length;
    const lastWeekCount = completionDates.filter((d) =>
      inRange(d, lastWeekStart, weekStart),
    ).length;

    const delta = thisWeekCount - lastWeekCount;
    const trend: WeekTrend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    const danger = thisWeekCount === 0;

    const personalityId = goal.mentor?.personalityId ?? DEFAULT_PERSONALITY;
    const mentorName = goal.mentor?.name ?? DEFAULT_MENTOR_NAME;

    const commentary = await this.generateCommentary(
      userId,
      personalityId,
      goal.title,
      thisWeekCount,
      lastWeekCount,
      trend,
    );

    return {
      goalId: goal.id,
      title: goal.title,
      mentorPersonalityId: personalityId,
      mentorName,
      thisWeekCount,
      lastWeekCount,
      delta,
      trend,
      danger,
      commentary,
    };
  }

  private async generateCommentary(
    userId: number,
    personalityId: string,
    goalTitle: string,
    thisWeekCount: number,
    lastWeekCount: number,
    trend: WeekTrend,
  ): Promise<string> {
    const fallback =
      FALLBACK[personalityId]?.[trend] ?? FALLBACK[DEFAULT_PERSONALITY][trend];

    const summary =
      `Goal: ${goalTitle}. This week: ${thisWeekCount} completion(s); ` +
      `last week: ${lastWeekCount}. Trend: ${trend}.`;

    try {
      const result = await this.gateway.chat({
        userId,
        feature: 'weekly-review',
        personalityId,
        event: 'weekly.review',
        messages: [{ role: 'user', content: summary }],
      });
      const text = result.text?.trim();
      return text && text.length > 0 ? text : fallback;
    } catch (err: any) {
      // A flaky model must not block the review — fall back to a template line.
      this.logger.warn(
        `Weekly-review commentary for "${personalityId}" failed (${err?.message}); using fallback`,
      );
      return fallback;
    }
  }

  /** Monday 00:00 local of the week containing `d`. */
  private startOfWeek(d: Date): Date {
    const out = new Date(d);
    const day = out.getDay(); // 0=Sun
    out.setDate(out.getDate() - (day === 0 ? 6 : day - 1)); // back to Monday
    out.setHours(0, 0, 0, 0);
    return out;
  }

  /** ISO-8601 week number (weeks start Monday; week 1 holds the first Thursday). */
  private isoWeekNumber(d: Date): number {
    const date = new Date(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
    );
    const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
    date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
    const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
    const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
    return (
      1 +
      Math.round(
        (date.getTime() - firstThursday.getTime()) / (7 * 86_400_000),
      )
    );
  }
}
