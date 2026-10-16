import { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enqueueComplete, enqueueExplain, drainOutbox } from '@/helpers/taskOutbox';
import { tasksService } from '@/services/tasks.service';

jest.mock('@/services/tasks.service', () => ({
  tasksService: {
    complete: jest.fn(),
    explain: jest.fn(),
  },
}));

const mockedTasks = tasksService as jest.Mocked<typeof tasksService>;

describe('taskOutbox', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('drains queued completions and reports the synced count', async () => {
    mockedTasks.complete.mockResolvedValue({} as any);
    await enqueueComplete('task-1', { moodScore: 3 } as any);
    await enqueueComplete('task-2', { moodScore: 4 } as any);

    const synced = await drainOutbox();

    expect(synced).toBe(2);
    expect(mockedTasks.complete).toHaveBeenCalledTimes(2);
    expect(await drainOutbox()).toBe(0); // queue is now empty
  });

  it('keeps failed entries queued for the next drain', async () => {
    mockedTasks.complete.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'));
    mockedTasks.explain.mockResolvedValue({} as any);
    await enqueueComplete('task-1', { moodScore: 3 } as any);
    await enqueueExplain('task-2', { reason: 'forgot' } as any);

    const synced = await drainOutbox();

    expect(synced).toBe(1); // explain succeeded, complete stayed queued
    mockedTasks.complete.mockResolvedValue({} as any);
    expect(await drainOutbox()).toBe(1); // retried successfully
  });

  const httpError = (status: number) =>
    new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
      status,
    } as any);

  it('treats 409 "already done" as synced and drops it', async () => {
    mockedTasks.complete.mockRejectedValue(httpError(409));
    await enqueueComplete('task-1', { moodScore: 3 } as any);
    expect(await drainOutbox()).toBe(1);
    expect(await drainOutbox()).toBe(0);
  });

  it('drops an entry the server rejects with a 4xx instead of retrying forever', async () => {
    mockedTasks.complete.mockRejectedValue(httpError(400));
    await enqueueComplete('task-1', { moodScore: 3 } as any);
    await drainOutbox();
    mockedTasks.complete.mockClear();
    await drainOutbox();
    expect(mockedTasks.complete).not.toHaveBeenCalled();
  });

  it('keeps an entry enqueued while a drain is in flight', async () => {
    let release: (() => void) | undefined;
    mockedTasks.complete.mockImplementationOnce(
      () => new Promise((r) => (release = () => r({} as any))),
    );
    await enqueueComplete('task-1', { moodScore: 3 } as any);
    const draining = drainOutbox();
    const enqueued = enqueueExplain('task-2', { reason: 'forgot' } as any);
    while (!release) await new Promise((r) => setTimeout(r, 0));
    release();
    await Promise.all([draining, enqueued]);
    mockedTasks.explain.mockResolvedValue({} as any);
    expect(await drainOutbox()).toBe(1); // task-2 survived the first drain
  });

  it('returns 0 without touching the network when the queue is empty', async () => {
    expect(await drainOutbox()).toBe(0);
    expect(mockedTasks.complete).not.toHaveBeenCalled();
    expect(mockedTasks.explain).not.toHaveBeenCalled();
  });
});
