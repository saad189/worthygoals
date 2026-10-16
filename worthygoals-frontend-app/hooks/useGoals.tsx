import { useQuery } from '@tanstack/react-query';
import { goalsApiService } from '@/services/goals.service';
import { ApiGoal } from '@/models';

export function useGoals() {
  const query = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApiService.list(),
    // placeholderData, not initialData — initialData counts as fresh cache and
    // suppresses the first fetch for the whole staleTime window.
    placeholderData: [] as ApiGoal[],
  });

  return {
    goals: query.data ?? [],
    // isLoading is never true with placeholderData (the query is "success"
    // from the first render); "showing the placeholder while fetching" is.
    loading: query.isPlaceholderData && query.isFetching,
    error: query.isError ? 'Failed to load goals' : null,
    refetch: () => {
      query.refetch();
    },
  };
}
