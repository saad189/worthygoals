import { differenceInYears, startOfDay, endOfDay } from 'date-fns';

/** Null when there is no date of birth — `new Date(null)` is 1970, i.e. age 56. */
export function calculateAge(dob: Date | string | null): number | null {
  if (!dob) return null;
  return differenceInYears(new Date(), new Date(dob));
}

export function getDayStartAndEnd(date: Date) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  return { startOfDay: dayStart, endOfDay: dayEnd };
}

export function extractTimeFromDate(dateParam: string | Date): string {
  const date = new Date(dateParam);
  return date.toTimeString().split(' ')[0];
}
