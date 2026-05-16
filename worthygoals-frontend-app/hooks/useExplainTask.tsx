import { useCallback, useState } from 'react';
import { tasksService } from '@/services/tasks.service';
import { enqueueExplain } from '@/helpers/taskOutbox';
import { ExplainTaskPayload } from '@/models';

export function useExplainTask(onSuccess?: (taskId: string) => void) {
  const [submitting, setSubmitting] = useState(false);

  const explain = useCallback(
    async (taskId: string, payload: ExplainTaskPayload) => {
      setSubmitting(true);
      try {
        await tasksService.explain(taskId, payload);
      } catch {
        await enqueueExplain(taskId, payload);
      } finally {
        setSubmitting(false);
        onSuccess?.(taskId);
      }
    },
    [onSuccess],
  );

  return { explain, submitting };
}
