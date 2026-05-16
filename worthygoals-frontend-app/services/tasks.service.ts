import ApiService from './api.service';
import {
  TaskItem,
  CreateTaskPayload,
  CompleteTaskPayload,
  ExplainTaskPayload,
  TaskCompletion,
  TaskExplanation,
} from '@/models';

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
  ): Promise<TaskCompletion> => {
    const { data } = await ApiService.post<TaskCompletion>(
      `${TASKS_BASE}/${taskId}/complete`,
      payload,
    );
    return data;
  },

  explain: async (
    taskId: string,
    payload: ExplainTaskPayload,
  ): Promise<TaskExplanation> => {
    const { data } = await ApiService.post<TaskExplanation>(
      `${TASKS_BASE}/${taskId}/explain`,
      payload,
    );
    return data;
  },
};
