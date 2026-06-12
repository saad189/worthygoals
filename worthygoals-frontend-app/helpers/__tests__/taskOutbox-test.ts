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
    mockedTasks.complete.mockRejectedValue(new Error('offline'));
    mockedTasks.explain.mockResolvedValue({} as any);
    await enqueueComplete('task-1', { moodScore: 3 } as any);
    await enqueueExplain('task-2', { reason: 'forgot' } as any);

    const synced = await drainOutbox();

    expect(synced).toBe(1); // explain succeeded, complete stayed queued
    mockedTasks.complete.mockResolvedValue({} as any);
    expect(await drainOutbox()).toBe(1); // retried successfully
  });

  it('returns 0 without touching the network when the queue is empty', async () => {
    expect(await drainOutbox()).toBe(0);
    expect(mockedTasks.complete).not.toHaveBeenCalled();
    expect(mockedTasks.explain).not.toHaveBeenCalled();
  });
});
