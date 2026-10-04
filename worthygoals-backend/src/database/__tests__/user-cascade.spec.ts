/**
 * GDPR erasure invariant (ECC-1 H5): every table that stores a userId must be
 * reachable by the cascade from `users`. Five tables used to carry userId with
 * no FK, and erasure depended on a hand-maintained purge list. The migration
 * fixed the schema; this keeps the next entity from reintroducing the gap —
 * the CI schema job then guarantees the entity matches the database.
 */
import { getMetadataArgsStorage } from 'typeorm';
import * as models from 'src/database/models';
import { User } from 'src/database/models/user.entity';

// Tables whose userId is intentionally not a reference to users.
const EXEMPT = new Set<string>([]);

describe('user-owned tables cascade from users', () => {
  // Importing the barrel registers every entity's decorators.
  void models;
  const storage = getMetadataArgsStorage();

  const withUserId = storage.columns
    .filter((c) => c.propertyName === 'userId')
    .map((c) => c.target as abstract new (...args: never[]) => unknown)
    .filter((t) => t !== User && !EXEMPT.has(t.name));

  it.each(withUserId.map((t) => [t.name, t]))(
    '%s has an ON DELETE CASCADE (or SET NULL) relation to User',
    (_name, target) => {
      const rel = storage.relations.find(
        (r) =>
          r.target === target &&
          r.relationType === 'many-to-one' &&
          (r.type as () => unknown)() === User,
      );
      expect(rel).toBeDefined();
      expect(['CASCADE', 'SET NULL']).toContain(rel!.options.onDelete);
    },
  );
});
