export type TaskStatus = 'pending' | 'completed' | 'skipped';
export type TaskRepeatFrequency = 'none' | 'daily' | 'weekly' | 'monthly';
export type ExplanationReason = 'couldnt' | 'forgot' | 'chose_not_to';

export interface TaskItem {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  repeatFrequency: TaskRepeatFrequency;
  occurrenceIndex: number;
  parentTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  goalId: string;
  description?: string;
  dueDate?: string;
  repeatFrequency?: TaskRepeatFrequency;
}

export interface CompleteTaskPayload {
  moodScore: 1 | 2 | 3 | 4;
  reflection?: string;
  memoryPictureId?: string;
}

export interface ExplainTaskPayload {
  reason: ExplanationReason;
  freeText?: string;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  moodScore: number;
  reflection?: string;
  memoryPictureId?: string;
  createdAt: string;
}

export interface TaskExplanation {
  id: string;
  taskId: string;
  reason: ExplanationReason;
  freeText?: string;
  createdAt: string;
}
