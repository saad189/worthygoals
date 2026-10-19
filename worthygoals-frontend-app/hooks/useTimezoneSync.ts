import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import ApiService from '@/services/api.service';

// The zone the server last accepted, for this app run. Module-level so a
// remount doesn't re-send it.
let synced: string | null = null;

export const deviceTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

/**
 * Keeps users.timezone equal to the device's zone. The server computes every
 * "today" — the today screen, roll-forward, streaks, the week, push hours — in
 * it, so a user who lands in another zone gets their new local day as soon as
 * the app comes back to the foreground. Mount once, inside the signed-in tabs.
 */
export function useTimezoneSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const sync = async () => {
      const tz = deviceTimeZone();
      if (tz === synced) return;
      try {
        await ApiService.put('/users/profile', { timezone: tz });
        synced = tz;
        // The server may have held another zone (the app was closed during
        // the move), so what was fetched before this may be the wrong day.
        for (const key of DAY_DEPENDENT_QUERIES) {
          queryClient.invalidateQueries({ queryKey: [key] });
        }
      } catch {
        // Retried on the next foreground; the server keeps the last zone.
      }
    };

    sync();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => sub.remove();
  }, [queryClient]);
}

const DAY_DEPENDENT_QUERIES = ['dashboard', 'tasks', 'weekly-review', 'board'];

/** Test seam: forget what was synced. */
export const resetTimezoneSync = () => {
  synced = null;
};
