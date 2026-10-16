import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '@/services/tasks.service';
import { enqueueExplain, isAlreadyDone, isRetryable } from '@/helpers/taskOutbox';
import { ExplainTaskPayload } from '@/models';
import { markTaskStatus } from '@/hooks/useTasks';

export function useExplainTask(
  onSuccess?: (taskId: string, hasReaction: boolean) => void,
) {
  const queryClient = useQueryClient();
  const [mentorReaction, setMentorReaction] = useState<string | null>(null);
  const [safetyFlag, setSafetyFlag] = useState(false);

  const mutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: ExplainTaskPayload }) =>
      tasksService.explain(taskId, payload),
    onMutate: ({ taskId }) => markTaskStatus(queryClient, taskId, 'skipped'),
    onSuccess: (response, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // a skip changes today's counts + this week's per-goal counts, so the
      // dashboard ring/week-strip and the weekly review both go stale (F3)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-review'] });
      const reactionText = response.mentorReaction ?? null;
      const wasSafetyFlag = response.safetyFlag ?? false;
      if (reactionText) setMentorReaction(reactionText);
      if (wasSafetyFlag) setSafetyFlag(true);
      onSuccess?.(taskId, !!reactionText || wasSafetyFlag);
    },
    onError: async (err, { taskId, payload }) => {
      // Only an unanswered request or a server failure is queued for retry.
      // A 409 means the server already has it; any other 4xx is final, so the
      // optimistic status is rolled back to the server's truth instead of
      // being queued (and re-sent) forever.
      if (isRetryable(err)) {
        await enqueueExplain(taskId, payload);
      } else if (!isAlreadyDone(err)) {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
      onSuccess?.(taskId, false);
    },
  });

  const explain = useCallback(
    (taskId: string, payload: ExplainTaskPayload) => {
      mutation.mutate({ taskId, payload });
    },
    [mutation],
  );

  const clearReaction = useCallback(() => {
    setMentorReaction(null);
    setSafetyFlag(false);
  }, []);

  return {
    explain,
    submitting: mutation.isPending,
    mentorReaction,
    safetyFlag,
    clearReaction,
  };
}
