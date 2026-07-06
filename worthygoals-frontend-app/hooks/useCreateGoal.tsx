import { useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsApiService } from '@/services/goals.service';
import type { ApiCreateGoalPayload } from '@/types/api';

/**
 * Creating a goal must refresh the goals list AND the dashboard (today screen),
 * same event-driven invalidation the completion/status mutations already use —
 * otherwise a new goal only appears after a manual app refresh.
 */
export function useCreateGoal() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: ApiCreateGoalPayload) => goalsApiService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    createGoal: (payload: ApiCreateGoalPayload) => mutation.mutateAsync(payload),
    saving: mutation.isPending,
  };
}
