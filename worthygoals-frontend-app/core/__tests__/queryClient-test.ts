/**
 * Guards I1. PersistQueryClientProvider had no dehydrateOptions filter, so
 * every query was written to AsyncStorage in plaintext under WG_QUERY_CACHE
 * with a 24h gcTime — while the tokens protecting the same data sit correctly
 * in SecureStore.
 *
 * The allowlist is the point: a query that is not named is not persisted, so a
 * new one is private by default.
 */
import { persistOptions } from '../queryClient';

const shouldPersist = (key: readonly unknown[]) =>
  persistOptions.dehydrateOptions.shouldDehydrateQuery({ queryKey: key });

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
});
