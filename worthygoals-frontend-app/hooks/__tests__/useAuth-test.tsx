/**
 * Guards D3: isAuthenticated must not be committed before the work that can
 * fail has succeeded.
 *
 * login() set the flag first and then awaited the profile fetch. A rejection
 * left the user "logged in" while app/index.tsx recovered the rejection and
 * routed to start-auth. The Stacks() guard only redirects in the other
 * direction, so nothing corrected it — and login.tsx suppresses its
 * remembered-email prefill whenever isAuthenticated is true, so the sign-in
 * screen read as a first launch.
 */
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';


import userService from '@/services/UserService';
import { AuthProvider, useAuth } from '../useAuth';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
  useNavigation: () => ({ dispatch: jest.fn(), replace: jest.fn() }),
}));
jest.mock('@/services/UserService', () => ({
  __esModule: true,
  default: { getProfile: jest.fn() },
}));
jest.mock('@/services/push.service', () => ({
  syncPushToken: jest.fn(),
  unregisterPushToken: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/services/onboarding.service', () => ({
  __esModule: true,
  default: { reset: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('@/helpers', () => ({
  clearTokens: jest.fn().mockResolvedValue(undefined),
  decodeJwtToken: jest.fn(() => ({ email: 'user@example.com' })),
  getUserLocationAsync: jest.fn().mockResolvedValue(null),
}));
jest.mock('@/helpers/SecureStorageUtil', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('./../useToastNotification', () => ({
  useToast: () => ({ showInfoMessage: jest.fn(), showErrorMessage: jest.fn() }),
}));
jest.mock('@/core/queryClient', () => ({ queryClient: { clear: jest.fn() } }));

const mockUserService = userService as jest.Mocked<typeof userService>;
const mockReplace = router.replace as unknown as jest.Mock;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth.login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('authenticates and routes home once the profile resolves', async () => {
    mockUserService.getProfile.mockResolvedValue({ id: 1, email: 'user@example.com' } as never);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('user@example.com');
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(mockReplace).toHaveBeenCalled();
  });

  it('leaves the user unauthenticated when the profile fetch rejects', async () => {
    mockUserService.getProfile.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('user@example.com').catch(() => undefined);
    });

    expect(result.current.isAuthenticated).toBe(false);
    // And it must not have navigated into the authenticated stack.
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('routes a user with no profile to the profile step, still authenticated', async () => {
    mockUserService.getProfile.mockResolvedValue(null as never);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login('user@example.com');
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(String(mockReplace.mock.calls[0][0])).toContain('profile');
  });
});
