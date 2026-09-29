import AsyncStorage from '@react-native-async-storage/async-storage';
import { tasksService } from '@/services/tasks.service';
import userService from '@/services/UserService';
import { CompleteTaskPayload, ExplainTaskPayload } from '@/models';

const OUTBOX_KEY = 'wg_task_outbox';

type OutboxEntry =
  | { type: 'complete'; taskId: string; payload: CompleteTaskPayload; queuedAt: number }
  | { type: 'explain'; taskId: string; payload: ExplainTaskPayload; queuedAt: number }
  // Onboarding rides the same queue rather than growing a second one: it needs
  // exactly the same "retry on next launch or foreground" behaviour, which
  // useOutboxDrain already provides.
  | {
      type: 'onboarding';
      choice: { tone?: string; personalityId?: string };
      queuedAt: number;
    };

async function readQueue(): Promise<OutboxEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(OUTBOX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: OutboxEntry[]): Promise<void> {
  await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(queue));
}

export async function enqueueComplete(
  taskId: string,
  payload: CompleteTaskPayload,
): Promise<void> {
  const queue = await readQueue();
  queue.push({ type: 'complete', taskId, payload, queuedAt: Date.now() });
  await writeQueue(queue);
}

export async function enqueueExplain(
  taskId: string,
  payload: ExplainTaskPayload,
): Promise<void> {
  const queue = await readQueue();
  queue.push({ type: 'explain', taskId, payload, queuedAt: Date.now() });
  await writeQueue(queue);
}

/**
 * Queues the onboarding choice for retry when the immediate sync fails.
 *
 * onboarding.service wrote ONBOARDING_COMPLETE before this sync and swallowed
 * any failure with "re-synced next time the profile is updated" — but
 * updateOnboarding's only caller was that line, so no re-sync existed. The
 * user's tone and matched mentor silently never reached the backend, and the
 * weekly review fell back to Marcus for the life of the goal.
 */
export async function enqueueOnboarding(choice: {
  tone?: string;
  personalityId?: string;
}): Promise<void> {
  const queue = await readQueue();
  // Only the latest choice matters.
  const withoutPrior: OutboxEntry[] = queue.filter(
    (e) => e.type !== 'onboarding',
  );
  withoutPrior.push({ type: 'onboarding', choice, queuedAt: Date.now() });
  await writeQueue(withoutPrior);
}

/**
 * Drains the outbox — wired to app start + foreground via useOutboxDrain.
 * Returns the number of entries successfully synced so callers can
 * invalidate stale queries only when something actually changed.
 */
export async function drainOutbox(): Promise<number> {
  const queue = await readQueue();
  if (!queue.length) return 0;

  const remaining: OutboxEntry[] = [];
  for (const entry of queue) {
    try {
      if (entry.type === 'complete') {
        await tasksService.complete(entry.taskId, entry.payload);
      } else if (entry.type === 'explain') {
        await tasksService.explain(entry.taskId, entry.payload);
      } else {
        await userService.updateOnboarding(entry.choice);
      }
    } catch {
      remaining.push(entry);
    }
  }
  await writeQueue(remaining);
  return queue.length - remaining.length;
}
