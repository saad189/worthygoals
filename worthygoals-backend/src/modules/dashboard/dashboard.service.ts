import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal, Task, TaskCompletion } from 'src/database/models';
import { GoalStatus, TaskStatus } from 'src/common/constants';
import { UsersService } from '../users/users.service';
import { completionDaysByGoal } from 'src/common/streaks/completion-days';
import {
  addDays,
  localDay,
  mondayOf,
  zonedMidnight,
} from 'src/common/timezone';
import {
  DashboardResponseDto,
  GoalSummaryDto,
  TaskSummaryDto,
} from './dto/dashboard-response.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Goal) private readonly goalRepo: Repository<Goal>,
    @InjectRepository(Task) private readonly taskRepo: Repository<Task>,
    @InjectRepository(TaskCompletion)
    private readonly completionRepo: Repository<TaskCompletion>,
    private readonly usersService: UsersService,
  ) {}

  async getDashboard(sub: string): Promise<DashboardResponseDto> {
    const user = await this.usersService.findByAccountSub(sub);
    if (!user) throw new NotFoundException('User not found');

    // The user's today, in their zone — a task is on it when dueOn matches.
    const tz = user.timezone;
    const today = localDay(tz);

    const [todaysTasks, weekCounts, goalSummaries] = await Promise.all([
      this.fetchTodaysTasks(user.id, today),
      this.fetchWeekCompletions(user.id, today, tz),
      this.fetchGoalSummaries(user.id, today, tz),
    ]);

    const totalToday = goalSummaries.reduce((s, g) => s + g.todayTaskCount, 0);
    const completedToday = goalSummaries.reduce(
      (s, g) => s + g.completedTodayCount,
      0,
    );

    return {
      todaysTasks,
      weekCompletions: weekCounts,
      goals: goalSummaries,
      todayProgress: { completed: completedToday, total: totalToday },
    };
  }

  private async fetchTodaysTasks(
    userId: number,
    today: string,
  ): Promise<TaskSummaryDto[]> {
    const tasks = await this.taskRepo
      .createQueryBuilder('t')
      .innerJoin('t.goal', 'g')
      .where('g.userId = :userId', { userId })
      // A paused or let-go goal's tasks leave today with it.
      .andWhere('g.status = :active', { active: GoalStatus.ACTIVE })
      .andWhere('t.dueOn = :today', { today })
      .andWhere('t.status = :status', { status: TaskStatus.PENDING })
      .select(['t.id', 't.title', 't.goalId', 't.status', 't.dueDate'])
      .getMany();

    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      goalId: t.goalId,
      status: t.status,
      dueDate: t.dueDate,
    }));
  }

  private async fetchWeekCompletions(
    userId: number,
    today: string,
    tz: string,
  ): Promise<number[]> {
    // Monday–Sunday of the user's week, bounded by their local midnights.
    const monday = mondayOf(today);
    const weekStart = zonedMidnight(monday, tz);
    const weekEnd = zonedMidnight(addDays(monday, 7), tz);

    const rows = await this.completionRepo
      .createQueryBuilder('c')
      .innerJoin('c.task', 't')
      .innerJoin('t.goal', 'g')
      .where('g.userId = :userId', { userId })
      .andWhere('c.createdAt >= :weekStart', { weekStart })
      .andWhere('c.createdAt < :weekEnd', { weekEnd })
      .select('c.createdAt', 'createdAt')
      .getRawMany<{ createdAt: string | Date }>();

    const counts = Array<number>(7).fill(0);
    for (const row of rows) {
      const day = localDay(tz, new Date(row.createdAt));
      const dow = Math.round(
        (Date.parse(day) - Date.parse(monday)) / 86_400_000,
      ); // 0=Mon … 6=Sun
      if (dow >= 0 && dow < 7) counts[dow]++;
    }
    return counts;
  }

  private async fetchGoalSummaries(
    userId: number,
    today: string,
    tz: string,
  ): Promise<GoalSummaryDto[]> {
    // Three bounded queries instead of hydrating goals × tasks × completions
    // (ECC-1 H4): the goals, their distinct completion days, and today's
    // per-goal task counts.
    const [goals, daysByGoal, todayRows] = await Promise.all([
      this.goalRepo.find({
        where: { userId, status: GoalStatus.ACTIVE },
        select: { id: true, title: true, category: true },
        order: { createdAt: 'DESC' },
      }),
      completionDaysByGoal(this.goalRepo.manager, userId, {
        activeGoalsOnly: true,
        timezone: tz,
      }),
      this.taskRepo
        .createQueryBuilder('t')
        .innerJoin('t.goal', 'g')
        .where('g.userId = :userId', { userId })
        .andWhere('g.status = :active', { active: GoalStatus.ACTIVE })
        .andWhere('t.dueOn = :today', { today })
        .select('t.goalId', 'goalId')
        // A skipped task was answered ("Not today" + a reason), so it isn't
        // left to do. Counting it kept the ring at "1 of 2 · One left" while
        // Up next (pending only) said "Everything done".
        .addSelect(
          `COUNT(*) FILTER (WHERE t.status <> '${TaskStatus.SKIPPED}')`,
          'total',
        )
        .addSelect(
          `COUNT(*) FILTER (WHERE t.status = '${TaskStatus.COMPLETED}')`,
          'completed',
        )
        .groupBy('t.goalId')
        .getRawMany<{ goalId: string; total: string; completed: string }>(),
    ]);

    const todayByGoal = new Map(todayRows.map((r) => [r.goalId, r]));

    return goals.map((goal) => {
      const { current, longest } = this.computeStreak(
        daysByGoal.get(goal.id) ?? [],
        today,
      );
      const counts = todayByGoal.get(goal.id);
      return {
        id: goal.id,
        title: goal.title,
        category: goal.category,
        currentStreak: current,
        longestStreak: longest,
        todayTaskCount: Number(counts?.total ?? 0),
        completedTodayCount: Number(counts?.completed ?? 0),
      };
    });
  }

  /** Deterministic streak computation from a list of completion timestamps. */
  computeStreak(
    dates: Date[],
    todayStr?: string,
  ): { current: number; longest: number } {
    if (dates.length === 0) return { current: 0, longest: 0 };

    // All date arithmetic uses local calendar dates to avoid UTC-offset drift
    const dayStr = (d: Date): string =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const parseLocalDay = (s: string): Date => {
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d); // local midnight, no UTC shift
    };

    const daySet = new Set(dates.map(dayStr));
    const days = [...daySet].sort(); // ascending YYYY-MM-DD

    // Longest consecutive run
    let longest = 1;
    let run = 1;
    for (let i = 1; i < days.length; i++) {
      const diff = Math.round(
        (parseLocalDay(days[i]).getTime() -
          parseLocalDay(days[i - 1]).getTime()) /
          86_400_000,
      );
      run = diff === 1 ? run + 1 : 1;
      if (run > longest) longest = run;
    }

    // Current streak: walk backwards from the user's today (or yesterday if
    // today has no completion yet).
    const today = todayStr ?? dayStr(new Date());
    const yesterdayStr = addDays(today, -1);
    let current = 0;
    if (daySet.has(today) || daySet.has(yesterdayStr)) {
      let check = parseLocalDay(daySet.has(today) ? today : yesterdayStr);
      while (daySet.has(dayStr(check))) {
        current++;
        check = new Date(
          check.getFullYear(),
          check.getMonth(),
          check.getDate() - 1,
        );
      }
    }

    return { current, longest: Math.max(longest, current) };
  }
}
