import type { components } from './api.gen';

export type { components };

// Convenience aliases so services don't need the verbose components['schemas']['...'] syntax.
export type ApiDashboardData = components['schemas']['DashboardData'];
export type ApiTaskSummary = components['schemas']['TaskSummary'];
export type ApiGoalSummary = components['schemas']['GoalSummary'];
export type ApiBoardItem = components['schemas']['BoardItem'];
export type ApiTaskItem = components['schemas']['TaskItem'];
export type ApiTaskStatus = components['schemas']['TaskStatus'];
export type ApiTaskRepeatFrequency = components['schemas']['TaskRepeatFrequency'];
export type ApiExplanationReason = components['schemas']['ExplanationReason'];
export type ApiCompleteTaskPayload = components['schemas']['CompleteTaskPayload'];
export type ApiExplainTaskPayload = components['schemas']['ExplainTaskPayload'];
export type ApiCreateTaskPayload = components['schemas']['CreateTaskPayload'];
export type ApiTaskCompletionResponse = components['schemas']['TaskCompletionResponse'];
export type ApiTaskExplanationResponse = components['schemas']['TaskExplanationResponse'];
export type ApiGoalProposal = components['schemas']['GoalProposal'];
export type ApiCreateGoalPayload = components['schemas']['CreateGoalPayload'];
export type ApiCreateGoalResponse = components['schemas']['CreateGoalResponse'];
