/**
 * Guards ECC-6 M8: a cold-start notification tap must not navigate before the
 * session is known — it used to race the auth redirect.
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { usePushNotifications } from '../usePushNotifications';

const mockResponse = {
  notification: { request: { content: { data: { kind: 'task_due' } } } },
};

jest.mock('expo-notifications', () => ({
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(mockResponse)),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/services/push.service', () => ({
  routeForNotification: () => '/(tabs)/todo-list-screen',
}));

let mockAuthed = false;
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: mockAuthed }),
}));

describe('usePushNotifications', () => {
  beforeEach(() => {
    (router.push as jest.Mock).mockClear();
    mockAuthed = false;
  });

  it('holds a cold-start tap until the session is confirmed, then routes once', async () => {
    const { rerender } = renderHook(() => usePushNotifications());
    // Let the cold-start promise resolve while still unauthenticated.
    await waitFor(() => expect(router.push).not.toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    expect(router.push).not.toHaveBeenCalled();

    mockAuthed = true;
    rerender({});

    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
    rerender({});
    expect(router.push).toHaveBeenCalledTimes(1);
  });

  it('routes immediately when already signed in', async () => {
    mockAuthed = true;
    renderHook(() => usePushNotifications());
    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1));
  });
});
