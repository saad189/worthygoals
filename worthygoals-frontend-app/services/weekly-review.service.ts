import { WeeklyReview } from "@/models";
import ApiService, { AI_REQUEST_TIMEOUT_MS } from "./api.service";

const WEEKLY_REVIEW_BASE = "/weekly-review";

export const weeklyReviewApiService = {
  get: async (): Promise<WeeklyReview> => {
    // One LLM call per active goal server-side — the default 10s timeout
    // aborts this by configuration.
    const { data } = await ApiService.get<WeeklyReview>(
      WEEKLY_REVIEW_BASE,
      undefined,
      { timeout: AI_REQUEST_TIMEOUT_MS },
    );
    return data;
  },
};
