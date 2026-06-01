import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '@/services/tasks.service';
import { enqueueExplain } from '@/helpers/taskOutbox';
import { ExplainTaskPayload } from '@/models';

export function useExplainTask(
  onSuccess?: (taskId: string, hasReaction: boolean) => void,
) {
  const queryClient = useQueryClient();
  const [mentorReaction, setMentorReaction] = useState<string | null>(null);
  const [safetyFlag, setSafetyFlag] = useState(false);

  const mutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: ExplainTaskPayload }) =>
      tasksService.explain(taskId, payload),
    onSuccess: (response, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      const reactionText = response.mentorReaction ?? null;
      const wasSafetyFlag = response.safetyFlag ?? false;
      if (reactionText) setMentorReaction(reactionText);
      if (wasSafetyFlag) setSafetyFlag(true);
      onSuccess?.(taskId, !!reactionText || wasSafetyFlag);
    },
    onError: async (_err, { taskId, payload }) => {
      await enqueueExplain(taskId, payload);
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
