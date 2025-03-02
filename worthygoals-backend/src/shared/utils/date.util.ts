import { differenceInYears, startOfDay, endOfDay } from 'date-fns';

export function calculateAge(dob: string) {
  return differenceInYears(new Date(), new Date(dob));
}

export function getDayStartAndEnd(date: Date) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  return { startOfDay: dayStart, endOfDay: dayEnd };
}
