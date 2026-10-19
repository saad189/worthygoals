/**
 * The server computes every "today" in users.timezone, so the app must send
 * the device's zone — once per run, and again whenever it changes.
 */
import React from 'react';
import { AppState } from 'react-native';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ApiService from '@/services/api.service';
import { resetTimezoneSync, useTimezoneSync } from '../useTimezoneSync';

jest.mock('@/services/api.service', () => ({
  __esModule: true,
  default: { put: jest.fn().mockResolvedValue({ data: {} }) },
}));

const setZone = (timeZone: string) =>
  jest
    .spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
    .mockReturnValue({ timeZone } as Intl.ResolvedDateTimeFormatOptions);

describe('useTimezoneSync', () => {
  let onChange: (state: string) => void;
  const client = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    resetTimezoneSync();
    (ApiService.put as jest.Mock).mockClear();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, fn) => {
      onChange = fn as (state: string) => void;
      return { remove: jest.fn() } as any;
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('sends the device zone, and again only after it changes', async () => {
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    setZone('Asia/Karachi');
    renderHook(() => useTimezoneSync(), { wrapper });
    await waitFor(() =>
      expect(ApiService.put).toHaveBeenCalledWith('/users/profile', {
        timezone: 'Asia/Karachi',
      }),
    );

    // Same zone on the next foreground: nothing to send.
    onChange('active');
    await Promise.resolve();
    expect(ApiService.put).toHaveBeenCalledTimes(1);

    // Landed in London: send it and refetch the day-dependent screens.
    invalidate.mockClear();
    setZone('Europe/London');
    onChange('active');
    await waitFor(() =>
      expect(ApiService.put).toHaveBeenLastCalledWith('/users/profile', {
        timezone: 'Europe/London',
      }),
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
  });

  it('retries on the next foreground after a failed send', async () => {
    setZone('Asia/Tokyo');
    (ApiService.put as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    renderHook(() => useTimezoneSync(), { wrapper });
    await waitFor(() => expect(ApiService.put).toHaveBeenCalledTimes(1));

    onChange('active');
    await waitFor(() => expect(ApiService.put).toHaveBeenCalledTimes(2));
  });
});
