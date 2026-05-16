import AsyncStorage from '@react-native-async-storage/async-storage';
import { tasksService } from '@/services/tasks.service';
import { CompleteTaskPayload, ExplainTaskPayload } from '@/models';

const OUTBOX_KEY = 'wg_task_outbox';

type OutboxEntry =
  | { type: 'complete'; taskId: string; payload: CompleteTaskPayload; queuedAt: number }
  | { type: 'explain'; taskId: string; payload: ExplainTaskPayload; queuedAt: number };

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

/** Drains the outbox — call on app foreground / network reconnect. */
export async function drainOutbox(): Promise<void> {
  const queue = await readQueue();
  if (!queue.length) return;

  const remaining: OutboxEntry[] = [];
  for (const entry of queue) {
    try {
      if (entry.type === 'complete') {
        await tasksService.complete(entry.taskId, entry.payload);
      } else {
        await tasksService.explain(entry.taskId, entry.payload);
      }
    } catch {
      remaining.push(entry);
    }
  }
  await writeQueue(remaining);
}
