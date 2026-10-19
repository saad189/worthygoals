import type { components } from './api.gen';

export type { components };

// Convenience aliases over the generated schemas. api.gen.ts is generated from
// the backend's openapi.json (npm run generate:api), which the Swagger CLI
// plugin now fills from the real DTOs — so these names are the backend's own.
type Schemas = components['schemas'];

export type ApiDashboardData = Schemas['DashboardResponseDto'];
export type ApiTaskSummary = Schemas['TaskSummaryDto'];
export type ApiGoalSummary = Schemas['GoalSummaryDto'];
export type ApiCompleteTaskPayload = Schemas['CompleteTaskDto'];
export type ApiExplainTaskPayload = Schemas['ExplainTaskDto'];
export type ApiCreateTaskPayload = Schemas['CreateTaskDto'];
export type ApiCreateGoalPayload = Schemas['CreateGoalDto'];
export type ApiCreateGoalResponse = Schemas['ResponseGoalDto'];
