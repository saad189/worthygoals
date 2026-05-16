import { useCallback, useEffect, useState } from 'react';
import { tasksService } from '@/services/tasks.service';
import { TaskItem, TaskStatus } from '@/models';

export function useTasks(goalId: string | null) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!goalId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await tasksService.list(goalId);
      setTasks(data);
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const optimisticUpdateStatus = useCallback((taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t)),
    );
  }, []);

  return { tasks, loading, error, refetch: fetch, optimisticUpdateStatus };
}
