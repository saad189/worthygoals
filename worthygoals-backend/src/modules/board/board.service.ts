import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal, Task, TaskCompletion } from 'src/database/models';
import { GoalStatus } from 'src/common/constants';
import { UsersService } from '../users/users.service';
import { MediaService } from '../media/media.service';
import { BoardItemDto } from './dto/board-item.dto';

const WIN_MOOD_THRESHOLD = 3;
const WIN_CARD_LIMIT = 50;

interface RawWinRow {
  c_id: string;
  c_moodScore: number;
  c_reflection: string | null;
  c_mentorReaction: string | null;
  c_memoryPictureId: string | null;
  c_createdAt: Date | string;
  taskTitle: string;
  goalTitle: string;
  goalCategory: string;
}

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(Goal) private readonly goalRepo: Repository<Goal>,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(TaskCompletion)
    private readonly completionRepo: Repository<TaskCompletion>,
    private readonly usersService: UsersService,
    private readonly mediaService: MediaService,
  ) {}

  async getBoard(sub: string): Promise<BoardItemDto[]> {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');

    const [winCards, milestoneCards] = await Promise.all([
      this.fetchWinCards(user.id),
      this.fetchMilestoneCards(user.id),
    ]);

    return [...winCards, ...milestoneCards].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  private async fetchWinCards(userId: number): Promise<BoardItemDto[]> {
    const rows = (await this.completionRepo
      .createQueryBuilder('c')
      .innerJoin('c.task', 't')
      .innerJoin('t.goal', 'g')
      .where('g.userId = :userId', { userId })
      .andWhere('c.moodScore >= :threshold', { threshold: WIN_MOOD_THRESHOLD })
      .addSelect('t.title', 'taskTitle')
      .addSelect('g.title', 'goalTitle')
      .addSelect('g.category', 'goalCategory')
      .orderBy('c.createdAt', 'DESC')
      .limit(WIN_CARD_LIMIT)
      .getRawMany()) as RawWinRow[];

    return Promise.all(
      rows.map(async (row) => {
        let mediaUrl: string | undefined;
        if (row.c_memoryPictureId) {
          mediaUrl =
            (await this.mediaService.getPresignedGetUrl(
              row.c_memoryPictureId,
            )) ?? undefined;
        }
        const createdAt =
          row.c_createdAt instanceof Date
            ? row.c_createdAt
            : new Date(row.c_createdAt);
        return {
          id: row.c_id,
          type: 'win' as const,
          taskTitle: row.taskTitle,
          goalTitle: row.goalTitle,
          goalCategory: row.goalCategory,
          moodScore: Number(row.c_moodScore),
          reflection: row.c_reflection ?? undefined,
          mentorReaction: row.c_mentorReaction ?? undefined,
          mediaUrl,
          createdAt,
        };
      }),
    );
  }

  private async fetchMilestoneCards(userId: number): Promise<BoardItemDto[]> {
    const goals = await this.goalRepo.find({
      where: { userId },
      relations: ['tasks', 'tasks.completions'],
    });

    const milestones: BoardItemDto[] = [];

    for (const goal of goals) {
      const allDates = goal.tasks.flatMap((t) =>
        t.completions.map((c) => c.createdAt),
      );
      const { longest, longestEndDate } = this.computeStreakDetails(allDates);

      if (longest >= 30) {
        milestones.push({
          id: `${goal.id}-streak-30`,
          type: 'milestone',
          goalTitle: goal.title,
          goalCategory: goal.category,
          milestoneKind: 'streak_30',
          streakDays: longest,
          createdAt: longestEndDate ?? goal.updatedAt,
        });
      } else if (longest >= 7) {
        milestones.push({
          id: `${goal.id}-streak-7`,
          type: 'milestone',
          goalTitle: goal.title,
          goalCategory: goal.category,
          milestoneKind: 'streak_7',
          streakDays: longest,
          createdAt: longestEndDate ?? goal.updatedAt,
        });
      }

      if (goal.status === GoalStatus.COMPLETED) {
        milestones.push({
          id: `${goal.id}-goal-completed`,
          type: 'milestone',
          goalTitle: goal.title,
          goalCategory: goal.category,
          milestoneKind: 'goal_completed',
          createdAt: goal.updatedAt,
        });
      }
    }

    return milestones;
  }

  private computeStreakDetails(dates: Date[]): {
    longest: number;
    longestEndDate: Date | null;
  } {
    if (dates.length === 0) return { longest: 0, longestEndDate: null };

    const dayStr = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const parseLocalDay = (s: string): Date => {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d);
    };

    const daySet = new Set(dates.map(dayStr));
    const days = [...daySet].sort();

    let longest = 1;
    let longestEndIdx = 0;
    let run = 1;

    for (let i = 1; i < days.length; i++) {
      const diff = Math.round(
        (parseLocalDay(days[i]).getTime() -
          parseLocalDay(days[i - 1]).getTime()) /
          86_400_000,
      );
      run = diff === 1 ? run + 1 : 1;
      if (run > longest) {
        longest = run;
        longestEndIdx = i;
      }
    }

    const longestEndDate = parseLocalDay(days[longestEndIdx]);
    return { longest, longestEndDate };
  }
}
