import { useCallback, useState } from 'react';
import { tasksService } from '@/services/tasks.service';
import { enqueueComplete } from '@/helpers/taskOutbox';
import { CompleteTaskPayload } from '@/models';

export function useCompleteTask(onSuccess?: (taskId: string) => void) {
  const [submitting, setSubmitting] = useState(false);

  const complete = useCallback(
    async (taskId: string, payload: CompleteTaskPayload) => {
      setSubmitting(true);
      try {
        await tasksService.complete(taskId, payload);
      } catch {
        await enqueueComplete(taskId, payload);
      } finally {
        setSubmitting(false);
        onSuccess?.(taskId);
      }
    },
    [onSuccess],
  );

  return { complete, submitting };
}
