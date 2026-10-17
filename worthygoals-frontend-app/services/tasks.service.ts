import ApiService, { AI_REQUEST_TIMEOUT_MS } from './api.service';
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
    // Both routes generate the mentor's reaction before answering, so they get
    // the AI budget; at 10s a slow reaction timed out after the server had
    // already saved the completion.
    const { data } = await ApiService.post<TaskActionResponse<TaskCompletion>>(
      `${TASKS_BASE}/${taskId}/complete`,
      payload,
      { timeout: AI_REQUEST_TIMEOUT_MS },
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
      { timeout: AI_REQUEST_TIMEOUT_MS },
    );
    return data;
  },

  update: async (
    taskId: string,
    payload: { title?: string; description?: string },
  ): Promise<TaskItem> => {
    const { data } = await ApiService.patch<TaskItem>(`${TASKS_BASE}/${taskId}`, payload);
    return data;
  },

  remove: async (taskId: string): Promise<void> => {
    await ApiService.delete(`${TASKS_BASE}/${taskId}`);
  },
};
