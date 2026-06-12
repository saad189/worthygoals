import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTasks } from '@/hooks/useTasks';
import { tasksService } from '@/services/tasks.service';
import { TaskItem } from '@/models';

jest.mock('@/services/tasks.service', () => ({
  tasksService: { list: jest.fn() },
}));

const mockedTasks = tasksService as jest.Mocked<typeof tasksService>;

const TASK: TaskItem = {
  id: 't1',
  goalId: 'g1',
  title: 'Read 10 pages',
  status: 'pending',
  repeatFrequency: 'none',
  occurrenceIndex: 0,
  createdAt: '2026-06-13T10:00:00.000Z',
  updatedAt: '2026-06-13T10:00:00.000Z',
};

function wrapperFor(client: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const clients: QueryClient[] = [];
function trackedClient(client: QueryClient) {
  clients.push(client);
  return client;
}

describe('useTasks', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => clients.splice(0).forEach((c) => c.clear()));

  it('fetches on first mount (placeholderData must not suppress the fetch)', async () => {
    const client = trackedClient(new QueryClient({
      // Mirror production staleTime — this is the regression case where
      // initialData was treated as fresh cache and no fetch happened.
      defaultOptions: { queries: { retry: false, staleTime: 1000 * 60 * 5 } },
    }));
    mockedTasks.list.mockResolvedValue([TASK]);

    const { result } = renderHook(() => useTasks('g1'), {
      wrapper: wrapperFor(client),
    });

    await waitFor(() => expect(result.current.tasks).toHaveLength(1));
    expect(mockedTasks.list).toHaveBeenCalledWith('g1');
    expect(result.current.tasks[0].title).toBe('Read 10 pages');
  });

  it('does not fetch when goalId is null', async () => {
    const client = trackedClient(new QueryClient({
      defaultOptions: { queries: { retry: false } },
    }));

    const { result } = renderHook(() => useTasks(null), {
      wrapper: wrapperFor(client),
    });

    expect(result.current.tasks).toEqual([]);
    expect(mockedTasks.list).not.toHaveBeenCalled();
  });

  it('optimisticUpdateStatus rewrites the cached task status', async () => {
    const client = trackedClient(new QueryClient({
      defaultOptions: { queries: { retry: false } },
    }));
    mockedTasks.list.mockResolvedValue([TASK]);

    const { result } = renderHook(() => useTasks('g1'), {
      wrapper: wrapperFor(client),
    });
    await waitFor(() => expect(result.current.tasks).toHaveLength(1));

    act(() => result.current.optimisticUpdateStatus('t1', 'completed'));

    await waitFor(() =>
      expect(result.current.tasks[0].status).toBe('completed'),
    );
  });
});
