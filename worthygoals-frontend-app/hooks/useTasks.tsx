import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '@/services/tasks.service';
import { TaskItem, TaskStatus } from '@/models';

export function useTasks(goalId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tasks', goalId],
    queryFn: () => tasksService.list(goalId!),
    enabled: !!goalId,
    // placeholderData, not initialData — initialData counts as fresh cache
    // and suppresses the first fetch for the whole staleTime window.
    placeholderData: [] as TaskItem[],
  });

  const optimisticUpdateStatus = useCallback(
    (taskId: string, status: TaskStatus) => {
      queryClient.setQueryData(['tasks', goalId], (prev: TaskItem[] = []) =>
        prev.map((t) => (t.id === taskId ? { ...t, status } : t)),
      );
    },
    [queryClient, goalId],
  );

  return {
    tasks: query.data ?? [],
    loading: query.isLoading,
    error: query.isError ? 'Failed to load tasks' : null,
    refetch: () => { query.refetch(); },
    optimisticUpdateStatus,
  };
}
