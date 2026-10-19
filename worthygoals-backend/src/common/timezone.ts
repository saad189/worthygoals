import { fromZonedTime } from 'date-fns-tz';

/**
 * Falls back to UTC for an IANA zone the runtime doesn't know. date-fns-tz
 * throws RangeError on one, and these zones come from devices: rows stored
 * before RegisterTokenDto validated the field can still hold anything.
 */
export function safeTimeZone(tz: string | null | undefined): string {
  if (!tz) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

/**
 * A user's calendar day ("YYYY-MM-DD") at `at`, in their own zone.
 *
 * Calendar days, not instants, are what a task is "due on": a daily habit
 * belongs to Oct 18 wherever the user is when Oct 18 arrives, so travelling
 * or a DST change can't move it to a neighbouring day.
 */
export function localDay(
  tz: string | null | undefined,
  at = new Date(),
): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTimeZone(tz),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
}

/** Calendar arithmetic on "YYYY-MM-DD" — no zone, so no DST surprises. */
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Same day-of-month `months` later, clamped: Jan 31 → Feb 28, not Mar 3. */
export function addMonthsClamped(day: string, months: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  first.setUTCDate(Math.min(d, last));
  return first.toISOString().slice(0, 10);
}

/** Monday of the ISO week containing `day`. */
export function mondayOf(day: string): string {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0=Sun
  return addDays(day, -(dow === 0 ? 6 : dow - 1));
}

/** A task's due fields for calendar `day`: the day itself + its local midnight. */
export function dueOnDay(
  day: string,
  tz: string | null | undefined,
): { dueOn: string; dueDate: Date } {
  return { dueOn: day, dueDate: zonedMidnight(day, tz) };
}

/** The instant `day` starts in `tz` — the user's local midnight. */
export function zonedMidnight(
  day: string,
  tz: string | null | undefined,
): Date {
  return fromZonedTime(`${day}T00:00:00`, safeTimeZone(tz));
}
