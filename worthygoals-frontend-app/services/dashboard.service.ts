import ApiService from './api.service';
import type { ApiDashboardData, ApiTaskSummary, ApiGoalSummary } from '@/types/api';

// Re-export spec-generated types under the names the rest of the app already uses.
export type TaskSummary = ApiTaskSummary;
export type GoalSummary = ApiGoalSummary;
export type DashboardData = ApiDashboardData;

const getDashboard = async (): Promise<DashboardData> => {
  const response = await ApiService.get<DashboardData>('/dashboard');
  return response.data;
};

export default { getDashboard };
