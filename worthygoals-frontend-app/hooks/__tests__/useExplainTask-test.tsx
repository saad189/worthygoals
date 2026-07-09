import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExplainTask } from '@/hooks/useExplainTask';
import { tasksService } from '@/services/tasks.service';
import { enqueueExplain } from '@/helpers/taskOutbox';

jest.mock('@/services/tasks.service', () => ({
  tasksService: { explain: jest.fn() },
}));

jest.mock('@/helpers/taskOutbox', () => ({
  enqueueExplain: jest.fn().mockResolvedValue(undefined),
}));

const mockedTasks = tasksService as jest.Mocked<typeof tasksService>;

describe('useExplainTask', () => {
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

  // F3: a skip changes today's counts + this week's per-goal counts, so both
  // the dashboard and the weekly review must invalidate — not just tasks.
  it('on success: invalidates tasks, dashboard and weekly-review', async () => {
    mockedTasks.explain.mockResolvedValue({
      mentorReaction: "Not today. Tomorrow you show up.",
      safetyFlag: false,
    } as any);
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useExplainTask(), { wrapper });
    act(() => result.current.explain('t1', { reason: 'chose_not_to' } as any));

    await waitFor(() =>
      expect(result.current.mentorReaction).toBe(
        'Not today. Tomorrow you show up.',
      ),
    );
    const invalidatedKeys = invalidateSpy.mock.calls.map(
      ([f]) => (f as any).queryKey[0],
    );
    expect(invalidatedKeys).toEqual(
      expect.arrayContaining(['tasks', 'dashboard', 'weekly-review']),
    );
  });

  it('on error: queues the explanation in the offline outbox', async () => {
    mockedTasks.explain.mockRejectedValue(new Error('network down'));
    const onSuccess = jest.fn();

    const { result } = renderHook(() => useExplainTask(onSuccess), { wrapper });
    act(() => result.current.explain('t1', { reason: 'forgot' } as any));

    await waitFor(() =>
      expect(enqueueExplain).toHaveBeenCalledWith('t1', { reason: 'forgot' }),
    );
    expect(onSuccess).toHaveBeenCalledWith('t1', false);
  });
});
