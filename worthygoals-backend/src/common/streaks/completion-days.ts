import { EntityManager } from 'typeorm';
import { safeTimeZone } from '../timezone';

/**
 * The distinct days each of a user's goals had a completion on, keyed by goal
 * id, as local-midnight Dates.
 *
 * Dashboard and board used to load goals × tasks × completions as full
 * entities on every app open — unbounded in the user's history — only to
 * reduce them to this set in JavaScript. Postgres now does the reduction and
 * returns one row per goal per day.
 *
 * Days are bucketed in the user's own timezone. The returned Dates are local
 * midnights in the server's zone purely as calendar-day carriers for the
 * streak code's getDate()/getMonth() arithmetic.
 *
 * ponytail: history is bucketed in the user's *current* zone, so after a move
 * a late-evening completion can shift to a neighbouring day. Exact would mean
 * storing each completion's local day; streaks don't need it.
 */
export async function completionDaysByGoal(
  manager: EntityManager,
  userId: number,
  {
    activeGoalsOnly,
    timezone,
  }: { activeGoalsOnly: boolean; timezone: string | null | undefined },
): Promise<Map<string, Date[]>> {
  const rows: Array<{ goalId: string; day: string }> = await manager.query(
    `
    SELECT t."goalId" AS "goalId",
           to_char(c."createdAt" AT TIME ZONE $2, 'YYYY-MM-DD') AS day
      FROM task_completions c
      JOIN tasks t ON t.id = c."taskId"
      JOIN goals g ON g.id = t."goalId"
     WHERE g."userId" = $1
       ${activeGoalsOnly ? "AND g.status = 'active'" : ''}
     GROUP BY 1, 2
    `,
    // Validated here: Postgres raises on a zone name it doesn't know.
    [userId, safeTimeZone(timezone)],
  );

  const byGoal = new Map<string, Date[]>();
  for (const { goalId, day } of rows) {
    const [y, m, d] = day.split('-').map(Number);
    const list = byGoal.get(goalId) ?? [];
    list.push(new Date(y, m - 1, d));
    byGoal.set(goalId, list);
  }
  return byGoal;
}
