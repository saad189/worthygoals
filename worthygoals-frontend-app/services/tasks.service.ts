import ApiService from './api.service';
import { TaskItem, TaskActionResponse, TaskCompletion, TaskExplanation } from '@/models';
import type { ApiCompleteTaskPayload, ApiCreateTaskPayload, ApiExplainTaskPayload } from '@/types/api';

type CreateTaskPayload = ApiCreateTaskPayload;
type CompleteTaskPayload = ApiCompleteTaskPayload;
type ExplainTaskPayload = ApiExplainTaskPayload;

const TASKS_BASE = '/tasks';

export const tasksService = {
  list: async (goalId: string): Promise<TaskItem[]> => {
    const { data } = await ApiService.get<TaskItem[]>(TASKS_BASE, { goalId });
    return data;
  },

  get: async (taskId: string): Promise<TaskItem> => {
    const { data } = await ApiService.get<TaskItem>(`${TASKS_BASE}/${taskId}`);
    return data;
  },

  create: async (payload: CreateTaskPayload): Promise<TaskItem> => {
    const { data } = await ApiService.post<TaskItem>(TASKS_BASE, payload);
    return data;
  },

  complete: async (
    taskId: string,
    payload: CompleteTaskPayload,
  ): Promise<TaskActionResponse<TaskCompletion>> => {
    const { data } = await ApiService.post<TaskActionResponse<TaskCompletion>>(
      `${TASKS_BASE}/${taskId}/complete`,
      payload,
    );
    return data;
  },

  explain: async (
    taskId: string,
    payload: ExplainTaskPayload,
  ): Promise<TaskActionResponse<TaskExplanation>> => {
    const { data } = await ApiService.post<TaskActionResponse<TaskExplanation>>(
      `${TASKS_BASE}/${taskId}/explain`,
      payload,
    );
    return data;
  },
};
