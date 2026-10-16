import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
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

/**
 * Worth queueing for later: the request never got an answer, or the server
 * failed. A 4xx is an answer — replaying it can only get the same one, and
 * used to sit in the queue forever, re-sent on every foreground.
 */
export function isRetryable(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  const status = err.response?.status;
  return status === undefined || status >= 500;
}

/** 409 "already completed/explained today": the server has it. */
export function isAlreadyDone(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 409;
}

// Every read-modify-write of the queue runs through this chain. drainOutbox
// read the queue, awaited the network, then wrote back what was left — so an
// entry enqueued meanwhile was overwritten and lost.
let lock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.catch(() => undefined);
  return run;
}

/** Called on sign-out: the queue holds the previous user's reflections and
 * onboarding choice, and would otherwise replay them under the next user. */
export function clearOutbox(): Promise<void> {
  return withLock(() => AsyncStorage.removeItem(OUTBOX_KEY));
}

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

export function enqueueComplete(
  taskId: string,
  payload: CompleteTaskPayload,
): Promise<void> {
  return withLock(async () => {
    const queue = await readQueue();
    queue.push({ type: 'complete', taskId, payload, queuedAt: Date.now() });
    await writeQueue(queue);
  });
}

export function enqueueExplain(
  taskId: string,
  payload: ExplainTaskPayload,
): Promise<void> {
  return withLock(async () => {
    const queue = await readQueue();
    queue.push({ type: 'explain', taskId, payload, queuedAt: Date.now() });
    await writeQueue(queue);
  });
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
export function enqueueOnboarding(choice: {
  tone?: string;
  personalityId?: string;
}): Promise<void> {
  return withLock(async () => {
    const queue = await readQueue();
    // Only the latest choice matters.
    const withoutPrior: OutboxEntry[] = queue.filter(
      (e) => e.type !== 'onboarding',
    );
    withoutPrior.push({ type: 'onboarding', choice, queuedAt: Date.now() });
    await writeQueue(withoutPrior);
  });
}

/**
 * Drains the outbox — wired to app start + foreground via useOutboxDrain.
 * Returns the number of entries successfully synced so callers can
 * invalidate stale queries only when something actually changed.
 */
export async function drainOutbox(): Promise<number> {
  // Held for the whole drain: enqueues wait for it rather than racing it.
  return withLock(async () => {
    const queue = await readQueue();
    if (!queue.length) return 0;

    const remaining: OutboxEntry[] = [];
    let synced = 0;
    for (const entry of queue) {
      try {
        if (entry.type === 'complete') {
          await tasksService.complete(entry.taskId, entry.payload);
        } else if (entry.type === 'explain') {
          await tasksService.explain(entry.taskId, entry.payload);
        } else {
          await userService.updateOnboarding(entry.choice);
        }
        synced += 1;
      } catch (err) {
        if (isAlreadyDone(err)) synced += 1;
        else if (isRetryable(err)) remaining.push(entry);
        // any other 4xx: the server rejected it for good — drop it
      }
    }
    await writeQueue(remaining);
    return synced;
  });
}
