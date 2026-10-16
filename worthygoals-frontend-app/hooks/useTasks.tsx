import { QueryClient, useQuery } from '@tanstack/react-query';
import { tasksService } from '@/services/tasks.service';
import { TaskItem, TaskStatus } from '@/models';

export function useTasks(goalId: string | null) {
  const query = useQuery({
    queryKey: ['tasks', goalId],
    queryFn: () => tasksService.list(goalId!),
    enabled: !!goalId,
    // placeholderData, not initialData — initialData counts as fresh cache
    // and suppresses the first fetch for the whole staleTime window.
    placeholderData: [] as TaskItem[],
  });

  return {
    tasks: query.data ?? [],
    loading: query.isLoading,
    error: query.isError ? 'Failed to load tasks' : null,
    refetch: () => { query.refetch(); },
  };
}

/**
 * Mark a task's status in every cached ['tasks', goalId] list. Called from the
 * complete/explain mutations' onMutate, i.e. before the request.
 *
 * It used to run from the screen's onSuccess callback, *after*
 * invalidateQueries had started the refetch — so online it was always
 * overwritten and did nothing. It stays applied on error on purpose: a failed
 * request is queued in the offline outbox, and the task is done locally.
 */
export async function markTaskStatus(
  queryClient: QueryClient,
  taskId: string,
  status: TaskStatus,
): Promise<void> {
  await queryClient.cancelQueries({ queryKey: ['tasks'] });
  queryClient.setQueriesData<TaskItem[]>({ queryKey: ['tasks'] }, (prev) =>
    prev?.map((t) => (t.id === taskId ? { ...t, status } : t)),
  );
}
