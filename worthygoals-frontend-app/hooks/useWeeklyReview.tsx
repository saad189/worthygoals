import { useQuery } from '@tanstack/react-query';
import { weeklyReviewApiService } from '@/services/weekly-review.service';

/**
 * The weekly review (Hi-Fi flow ⑥, screen 15) — per-goal trend + each goal's
 * mentor reacting to the week. Commentary is AI-generated server-side, so this
 * is heavier than a plain aggregate; cache it for the session rather than
 * refetching aggressively.
 */
export function useWeeklyReview() {
  const query = useQuery({
    queryKey: ['weekly-review'],
    queryFn: () => weeklyReviewApiService.get(),
    staleTime: 1000 * 60 * 10,
  });

  return {
    review: query.data ?? null,
    loading: query.isLoading,
    error: query.isError ? 'Failed to load the weekly review' : null,
    refetch: () => {
      query.refetch();
    },
    refreshing: query.isRefetching,
  };
}
