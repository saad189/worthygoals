// Shapes returned by GET /weekly-review (the backend's WeeklyReviewDto). That
// route isn't described in openapi.json yet, so these are hand-written to match
// it — keep in sync with src/modules/weekly-review/dto/weekly-review.dto.ts on
// the backend (same convention as ApiGoal / StatusPost).

export type WeekTrend = "up" | "flat" | "down";

export interface GoalWeekRow {
  goalId: string;
  title: string;
  /** personalityId slug — marcus / lyra / goggs. Drives the avatar + voice styling. */
  mentorPersonalityId: string;
  mentorName: string;
  thisWeekCount: number;
  lastWeekCount: number;
  /** thisWeekCount − lastWeekCount. */
  delta: number;
  trend: WeekTrend;
  /** No completions this week — the row to talk about. */
  danger: boolean;
  /** The goal's mentor reacting to the week, in voice. */
  commentary: string;
}

export interface WeeklyReview {
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  onTrackCount: number;
  totalGoals: number;
  goals: GoalWeekRow[];
}
