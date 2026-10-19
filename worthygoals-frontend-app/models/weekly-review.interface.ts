// Shapes returned by GET /weekly-review, generated from the backend's
// WeeklyReviewDto via openapi.json — the pre-push contract gate fails if the
// backend changes them without the app regenerating.
import type { components } from '@/types/api.gen';

export type GoalWeekRow = components['schemas']['GoalWeekRowDto'];
export type WeekTrend = GoalWeekRow['trend'];
export type WeeklyReview = components['schemas']['WeeklyReviewDto'];
