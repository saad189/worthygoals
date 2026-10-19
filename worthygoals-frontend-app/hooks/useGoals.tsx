import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { goalsApiService } from '@/services/goals.service';
import { ApiGoal, GoalStatus } from '@/models';
import { useToast } from './useToastNotification';

/** What each lifecycle move tells the user it did. */
const STATUS_TOAST: Partial<Record<GoalStatus, string>> = {
  paused: 'Paused. It\'s off today and quiet until you resume it.',
  archived: 'Let go. No more tasks or nudges for it.',
  active: 'Back on. It\'s on today again.',
};

/**
 * Pause / Let it go / Resume. A goal that isn't active leaves the today screen
 * and stops rolling forward server-side, so every view that shows work is
 * refetched, not just the goals list.
 */
export function useSetGoalStatus() {
  const queryClient = useQueryClient();
  const { showSuccessMessage, showErrorMessage } = useToast();

  const mutation = useMutation({
    mutationFn: ({ goalId, status }: { goalId: string; status: GoalStatus }) =>
      goalsApiService.update(goalId, { status }),
    onSuccess: (goal) => {
      queryClient.setQueryData<ApiGoal[]>(['goals'], (prev) =>
        prev?.map((g) => (g.id === goal.id ? goal : g)),
      );
      for (const key of ['goals', 'dashboard', 'tasks', 'weekly-review']) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      const msg = STATUS_TOAST[goal.status];
      if (msg) showSuccessMessage(msg);
    },
    onError: () => showErrorMessage("Couldn't update the goal. Try again."),
  });

  return {
    setStatus: (goalId: string, status: GoalStatus) =>
      mutation.mutate({ goalId, status }),
    updating: mutation.isPending,
  };
}

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
