import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCompleteTask } from '@/hooks/useCompleteTask';
import { tasksService } from '@/services/tasks.service';
import { enqueueComplete } from '@/helpers/taskOutbox';

jest.mock('@/services/tasks.service', () => ({
  tasksService: { complete: jest.fn() },
}));

jest.mock('@/helpers/taskOutbox', () => ({
  enqueueComplete: jest.fn().mockResolvedValue(undefined),
}));

const mockedTasks = tasksService as jest.Mocked<typeof tasksService>;

describe('useCompleteTask', () => {
  let client: QueryClient;
  let wrapper: ({ children }: { children: React.ReactNode }) => JSX.Element;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    wrapper = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  });

  afterEach(() => client.clear());

  it('on success: surfaces the mentor reaction and invalidates tasks, dashboard and board', async () => {
    mockedTasks.complete.mockResolvedValue({
      mentorReaction: 'Knew you had it. Same time tomorrow.',
      safetyFlag: false,
    } as any);
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useCompleteTask(onSuccess), { wrapper });
    act(() => result.current.complete('t1', { moodScore: 4 } as any));

    await waitFor(() =>
      expect(result.current.mentorReaction).toBe(
        'Knew you had it. Same time tomorrow.',
      ),
    );
    const invalidatedKeys = invalidateSpy.mock.calls.map(
      ([f]) => (f as any).queryKey[0],
    );
    expect(invalidatedKeys).toEqual(
      expect.arrayContaining(['tasks', 'dashboard', 'board']),
    );
    expect(onSuccess).toHaveBeenCalledWith('t1', true);
  });

  it('on error: queues the completion in the offline outbox', async () => {
    mockedTasks.complete.mockRejectedValue(new Error('network down'));
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useCompleteTask(onSuccess), { wrapper });
    act(() => result.current.complete('t1', { moodScore: 2 } as any));

    await waitFor(() =>
      expect(enqueueComplete).toHaveBeenCalledWith('t1', { moodScore: 2 }),
    );
    expect(onSuccess).toHaveBeenCalledWith('t1', false);
    expect(result.current.mentorReaction).toBeNull();
  });

  it('clearReaction resets reaction state', async () => {
    mockedTasks.complete.mockResolvedValue({
      mentorReaction: 'Good.',
      safetyFlag: false,
    } as any);

    const { result } = renderHook(() => useCompleteTask(), { wrapper });
    act(() => result.current.complete('t1', { moodScore: 3 } as any));
    await waitFor(() => expect(result.current.mentorReaction).toBe('Good.'));

    act(() => result.current.clearReaction());
    expect(result.current.mentorReaction).toBeNull();
    expect(result.current.safetyFlag).toBe(false);
  });
});
