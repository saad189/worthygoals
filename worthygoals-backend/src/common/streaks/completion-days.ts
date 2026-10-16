import { EntityManager } from 'typeorm';

/**
 * The distinct days each of a user's goals had a completion on, keyed by goal
 * id, as local-midnight Dates.
 *
 * Dashboard and board used to load goals × tasks × completions as full
 * entities on every app open — unbounded in the user's history — only to
 * reduce them to this set in JavaScript. Postgres now does the reduction and
 * returns one row per goal per day.
 *
 * Days are bucketed in the server process's own timezone, the zone the
 * existing streak code already used via getDate()/getMonth(), so streak
 * results are unchanged. (That zone is still not the user's — see the
 * ponytail note in AddPerDayCompletionUniqueness.)
 */
export async function completionDaysByGoal(
  manager: EntityManager,
  userId: number,
  { activeGoalsOnly }: { activeGoalsOnly: boolean },
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
    [userId, Intl.DateTimeFormat().resolvedOptions().timeZone],
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
