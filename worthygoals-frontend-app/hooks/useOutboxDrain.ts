import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { drainOutbox } from '@/helpers/taskOutbox';

/**
 * Flushes queued offline completions/explanations on app start and
 * whenever the app returns to the foreground. Mount once, inside the
 * QueryClientProvider, so synced entries can refresh the affected caches.
 */
export function useOutboxDrain() {
  const queryClient = useQueryClient();
  const drainingRef = useRef(false);

  useEffect(() => {
    const drain = async () => {
      if (drainingRef.current) return;
      drainingRef.current = true;
      try {
        const synced = await drainOutbox();
        if (synced > 0) {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['board'] });
        }
      } finally {
        drainingRef.current = false;
      }
    };

    drain();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') drain();
    });
    return () => sub.remove();
  }, [queryClient]);
}
