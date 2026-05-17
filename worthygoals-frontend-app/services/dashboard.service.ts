import ApiService from './api.service';

export interface TaskSummary {
  id: string;
  title: string;
  goalId: string;
  status: string;
  dueDate?: string;
}

export interface GoalSummary {
  id: string;
  title: string;
  category: string;
  currentStreak: number;
  longestStreak: number;
  todayTaskCount: number;
  completedTodayCount: number;
}

export interface DashboardData {
  todaysTasks: TaskSummary[];
  /** Completion counts indexed Mon=0 … Sun=6 */
  weekCompletions: number[];
  goals: GoalSummary[];
  todayProgress: { completed: number; total: number };
}

const getDashboard = async (): Promise<DashboardData> => {
  const response = await ApiService.get<DashboardData>('/dashboard');
  return response.data;
};

export default { getDashboard };
