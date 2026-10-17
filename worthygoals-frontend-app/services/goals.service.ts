import { ApiGoal, GoalProposal } from "@/models";
import type { ApiCreateGoalPayload, ApiCreateGoalResponse } from '@/types/api';
import ApiService, { AI_REQUEST_TIMEOUT_MS } from "./api.service";

const GOALS_BASE = '/goals';

export const goalsApiService = {
  list: async (): Promise<ApiGoal[]> => {
    const { data } = await ApiService.get<ApiGoal[]>(GOALS_BASE);
    return data ?? [];
  },

  propose: async (raw: string): Promise<GoalProposal> => {
    const { data } = await ApiService.post<GoalProposal>(
      `${GOALS_BASE}/propose`,
      { raw },
      { timeout: AI_REQUEST_TIMEOUT_MS },
    );
    return data;
  },

  create: async (payload: ApiCreateGoalPayload): Promise<ApiCreateGoalResponse> => {
    const { data } = await ApiService.post<ApiCreateGoalResponse>(GOALS_BASE, payload);
    return data;
  },

  update: async (
    goalId: string,
    payload: { title?: string; description?: string },
  ): Promise<ApiGoal> => {
    const { data } = await ApiService.patch<ApiGoal>(`${GOALS_BASE}/${goalId}`, payload);
    return data;
  },

  /** Cascades server-side to the goal's tasks, completions and explanations. */
  remove: async (goalId: string): Promise<void> => {
    await ApiService.delete(`${GOALS_BASE}/${goalId}`);
  },
};
