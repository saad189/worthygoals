/**
 * Guards I1. PersistQueryClientProvider had no dehydrateOptions filter, so
 * every query was written to AsyncStorage in plaintext under WG_QUERY_CACHE
 * with a 24h gcTime — while the tokens protecting the same data sit correctly
 * in SecureStore.
 *
 * The allowlist is the point: a query that is not named is not persisted, so a
 * new one is private by default.
 *
 * Only successful queries are persisted: a failed one carries its AxiosError,
 * and the error's request config held the Bearer access token.
 */
import { Query } from '@tanstack/react-query';
import { persistOptions } from '../queryClient';

const query = (queryKey: readonly unknown[], status = 'success') =>
  ({ queryKey, state: { status } }) as unknown as Query;

const shouldPersist = (key: readonly unknown[], status?: string) =>
  persistOptions.dehydrateOptions.shouldDehydrateQuery(query(key, status));

describe('query cache persistence', () => {
  it.each([[['dashboard']], [['tasks']], [['tasks', 'goal-1']], [['goals']], [['mentors']]])(
    'persists %j — the offline experience reads it on a cold start',
    (key) => {
      expect(shouldPersist(key)).toBe(true);
    },
  );

  it.each([[['status']], [['weekly-review']], [['board']], [['profile']]])(
    'does not persist %j — free-text or PII-heavy, refetched on launch',
    (key) => {
      expect(shouldPersist(key)).toBe(false);
    },
  );

  it('treats an unknown query as private by default', () => {
    expect(shouldPersist(['some-future-feature'])).toBe(false);
  });

  it.each(['error', 'pending'])(
    'never persists an allowlisted query in %s state — its error held the Bearer token',
    (status) => {
      expect(shouldPersist(['dashboard'], status)).toBe(false);
    },
  );
});
