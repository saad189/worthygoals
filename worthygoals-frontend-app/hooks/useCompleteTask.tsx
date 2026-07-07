import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '@/services/tasks.service';
import { enqueueComplete } from '@/helpers/taskOutbox';
import { CompleteTaskPayload } from '@/models';

export function useCompleteTask(
  onSuccess?: (taskId: string, hasReaction: boolean) => void,
) {
  const queryClient = useQueryClient();
  const [mentorReaction, setMentorReaction] = useState<string | null>(null);
  const [safetyFlag, setSafetyFlag] = useState(false);

  const mutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: CompleteTaskPayload }) =>
      tasksService.complete(taskId, payload),
    onSuccess: (response, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      // completions with mood ≥ 🙂 create board win cards
      queryClient.invalidateQueries({ queryKey: ['board'] });
      // a completion changes this week's per-goal counts (F3)
      queryClient.invalidateQueries({ queryKey: ['weekly-review'] });
      const reactionText = response.mentorReaction ?? null;
      const wasSafetyFlag = response.safetyFlag ?? false;
      if (reactionText) setMentorReaction(reactionText);
      if (wasSafetyFlag) setSafetyFlag(true);
      onSuccess?.(taskId, !!reactionText || wasSafetyFlag);
    },
    onError: async (_err, { taskId, payload }) => {
      await enqueueComplete(taskId, payload);
      onSuccess?.(taskId, false);
    },
  });

  const complete = useCallback(
    (taskId: string, payload: CompleteTaskPayload) => {
      mutation.mutate({ taskId, payload });
    },
    [mutation],
  );

  const clearReaction = useCallback(() => {
    setMentorReaction(null);
    setSafetyFlag(false);
  }, []);

  return {
    complete,
    submitting: mutation.isPending,
    mentorReaction,
    safetyFlag,
    clearReaction,
  };
}
