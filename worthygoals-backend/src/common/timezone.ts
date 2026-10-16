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
