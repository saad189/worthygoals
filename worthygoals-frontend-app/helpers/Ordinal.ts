/** 1 → "1ST", 2 → "2ND", 3 → "3RD", 4 → "4TH", 11 → "11TH" … Uppercase
 *  ordinal for mono eyebrows — e.g. the seriousness check's
 *  "3RD MISS THIS WEEK" (Hi-Fi screen 11). */
export function ordinal(n: number): string {
  const suffixes = ['TH', 'ST', 'ND', 'RD'];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]}`;
}
