import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal, Task, TaskCompletion } from 'src/database/models';
import { GoalStatus, TaskStatus } from 'src/common/constants';
import { UsersService } from '../users/users.service';
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

    const today = this.startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todaysTasks, weekCounts, goalSummaries] = await Promise.all([
      this.fetchTodaysTasks(user.id, today, tomorrow),
      this.fetchWeekCompletions(user.id),
      this.fetchGoalSummaries(user.id, today, tomorrow),
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
    today: Date,
    tomorrow: Date,
  ): Promise<TaskSummaryDto[]> {
    const tasks = await this.taskRepo
      .createQueryBuilder('t')
      .innerJoin('t.goal', 'g')
      .where('g.userId = :userId', { userId })
      .andWhere('t.dueDate >= :today', { today })
      .andWhere('t.dueDate < :tomorrow', { tomorrow })
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

  private async fetchWeekCompletions(userId: number): Promise<number[]> {
    const weekStart = this.startOfWeek(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

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
      const d = new Date(row.createdAt);
      const dow = (d.getDay() + 6) % 7; // 0=Mon … 6=Sun
      counts[dow]++;
    }
    return counts;
  }

  private async fetchGoalSummaries(
    userId: number,
    today: Date,
    tomorrow: Date,
  ): Promise<GoalSummaryDto[]> {
    const goals = await this.goalRepo.find({
      where: { userId, status: GoalStatus.ACTIVE },
      relations: ['tasks', 'tasks.completions'],
      order: { createdAt: 'DESC' },
    });

    return goals.map((goal) => {
      const allDates = goal.tasks.flatMap((t) =>
        t.completions.map((c) => c.createdAt),
      );
      const { current, longest } = this.computeStreak(allDates);

      const todayTasks = goal.tasks.filter((t) => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d >= today && d < tomorrow;
      });

      return {
        id: goal.id,
        title: goal.title,
        category: goal.category,
        currentStreak: current,
        longestStreak: longest,
        todayTaskCount: todayTasks.length,
        completedTodayCount: todayTasks.filter(
          (t) => t.status === TaskStatus.COMPLETED,
        ).length,
      };
    });
  }

  /** Deterministic streak computation from a list of completion timestamps. */
  computeStreak(dates: Date[]): { current: number; longest: number } {
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
        (parseLocalDay(days[i]).getTime() - parseLocalDay(days[i - 1]).getTime()) /
          86_400_000,
      );
      run = diff === 1 ? run + 1 : 1;
      if (run > longest) longest = run;
    }

    // Current streak: walk backwards from today (or yesterday if today has no completion)
    const now = new Date();
    const todayStr = dayStr(now);
    const yesterdayStr = dayStr(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
    );
    let current = 0;
    if (daySet.has(todayStr) || daySet.has(yesterdayStr)) {
      let check = parseLocalDay(daySet.has(todayStr) ? todayStr : yesterdayStr);
      while (daySet.has(dayStr(check))) {
        current++;
        check = new Date(check.getFullYear(), check.getMonth(), check.getDate() - 1);
      }
    }

    return { current, longest: Math.max(longest, current) };
  }

  private startOfDay(d: Date): Date {
    const out = new Date(d);
    out.setHours(0, 0, 0, 0);
    return out;
  }

  private startOfWeek(d: Date): Date {
    const out = new Date(d);
    const day = out.getDay(); // 0=Sun
    out.setDate(out.getDate() - (day === 0 ? 6 : day - 1)); // back to Monday
    out.setHours(0, 0, 0, 0);
    return out;
  }
}
