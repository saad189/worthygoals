import { useCallback, useState } from 'react';
import { tasksService } from '@/services/tasks.service';
import { enqueueComplete } from '@/helpers/taskOutbox';
import { CompleteTaskPayload } from '@/models';

export function useCompleteTask(
  onSuccess?: (taskId: string, hasReaction: boolean) => void,
) {
  const [submitting, setSubmitting] = useState(false);
  const [mentorReaction, setMentorReaction] = useState<string | null>(null);
  const [safetyFlag, setSafetyFlag] = useState(false);

  const complete = useCallback(
    async (taskId: string, payload: CompleteTaskPayload) => {
      setSubmitting(true);
      setMentorReaction(null);
      setSafetyFlag(false);
      let reactionText: string | null = null;
      let wasSafetyFlag = false;
      try {
        const response = await tasksService.complete(taskId, payload);
        reactionText = response.mentorReaction ?? null;
        wasSafetyFlag = response.safetyFlag ?? false;
        if (reactionText) setMentorReaction(reactionText);
        if (wasSafetyFlag) setSafetyFlag(true);
      } catch {
        await enqueueComplete(taskId, payload);
      } finally {
        setSubmitting(false);
        onSuccess?.(taskId, !!reactionText || wasSafetyFlag);
      }
    },
    [onSuccess],
  );

  const clearReaction = useCallback(() => {
    setMentorReaction(null);
    setSafetyFlag(false);
  }, []);

  return { complete, submitting, mentorReaction, safetyFlag, clearReaction };
}
