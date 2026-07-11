import { ApiGoal, GoalProposal } from "@/models";
import type { ApiCreateGoalPayload, ApiCreateGoalResponse } from '@/types/api';
import ApiService from "./api.service";

const GOALS_BASE = '/goals';

export const goalsApiService = {
  list: async (): Promise<ApiGoal[]> => {
    const { data } = await ApiService.get<ApiGoal[]>(GOALS_BASE);
    return data ?? [];
  },

  propose: async (raw: string): Promise<GoalProposal> => {
    const { data } = await ApiService.post<GoalProposal>(`${GOALS_BASE}/propose`, { raw });
    return data;
  },

  create: async (payload: ApiCreateGoalPayload): Promise<ApiCreateGoalResponse> => {
    const { data } = await ApiService.post<ApiCreateGoalResponse>(GOALS_BASE, payload);
    return data;
  },
};
