import { useCallback, useState } from 'react';
import { tasksService } from '@/services/tasks.service';
import { enqueueExplain } from '@/helpers/taskOutbox';
import { ExplainTaskPayload } from '@/models';

export function useExplainTask(
  onSuccess?: (taskId: string, hasReaction: boolean) => void,
) {
  const [submitting, setSubmitting] = useState(false);
  const [mentorReaction, setMentorReaction] = useState<string | null>(null);
  const [safetyFlag, setSafetyFlag] = useState(false);

  const explain = useCallback(
    async (taskId: string, payload: ExplainTaskPayload) => {
      setSubmitting(true);
      setMentorReaction(null);
      setSafetyFlag(false);
      let reactionText: string | null = null;
      let wasSafetyFlag = false;
      try {
        const response = await tasksService.explain(taskId, payload);
        reactionText = response.mentorReaction ?? null;
        wasSafetyFlag = response.safetyFlag ?? false;
        if (reactionText) setMentorReaction(reactionText);
        if (wasSafetyFlag) setSafetyFlag(true);
      } catch {
        await enqueueExplain(taskId, payload);
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

  return { explain, submitting, mentorReaction, safetyFlag, clearReaction };
}
