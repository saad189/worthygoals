export class TaskSummaryDto {
  id!: string;
  title!: string;
  goalId!: string;
  status!: string;
  dueDate?: Date;
}

export class GoalSummaryDto {
  id!: string;
  title!: string;
  category!: string;
  currentStreak!: number;
  longestStreak!: number;
  todayTaskCount!: number;
  completedTodayCount!: number;
}

export class TodayProgressDto {
  completed!: number;
  total!: number;
}

export class DashboardResponseDto {
  todaysTasks!: TaskSummaryDto[];
  /** Completion counts indexed Mon=0 … Sun=6 for the current calendar week */
  weekCompletions!: number[];
  goals!: GoalSummaryDto[];
  todayProgress!: TodayProgressDto;
}
