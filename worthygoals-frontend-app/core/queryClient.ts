import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,  // 24 h — keep cached data for offline reads
      staleTime: 1000 * 60 * 5,     // 5 min — background refetch window
      retry: 2,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'WG_QUERY_CACHE',
});

/**
 * Query keys allowed into the on-device cache.
 *
 * PersistQueryClientProvider was given no dehydrateOptions filter, so *every*
 * query was written to AsyncStorage in plaintext under WG_QUERY_CACHE with a
 * 24h gcTime — while the tokens protecting the same data sit correctly in
 * SecureStore. AsyncStorage is not encrypted.
 *
 * This is an allowlist, not a blocklist: a new query is private by default and
 * has to be named here to be persisted.
 *
 * What is kept is what the offline experience actually reads on a cold start
 * with no network. What is left out is the free-text and PII-heavy material —
 * status posts, the AI's weekly commentary, board reflections, the profile —
 * which refetches on launch and is not worth holding in the clear.
 *
 * ponytail: the ceiling here is that the persisted subset is still plaintext.
 * Encrypting it properly means a persister backed by expo-secure-store (which
 * has a 2KB per-item limit, so it needs chunking) or SQLCipher — worth it only
 * if the cached goal titles are themselves considered sensitive.
 */
const PERSISTED_QUERY_KEYS = ['dashboard', 'tasks', 'goals', 'mentors'];

export const persistOptions = {
  persister: asyncStoragePersister,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[] }) =>
      PERSISTED_QUERY_KEYS.includes(String(query.queryKey[0])),
  },
};
