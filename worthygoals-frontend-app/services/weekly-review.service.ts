import { WeeklyReview } from "@/models";
import ApiService from "./api.service";

const WEEKLY_REVIEW_BASE = "/weekly-review";

export const weeklyReviewApiService = {
  get: async (): Promise<WeeklyReview> => {
    const { data } = await ApiService.get<WeeklyReview>(WEEKLY_REVIEW_BASE);
    return data;
  },
};
