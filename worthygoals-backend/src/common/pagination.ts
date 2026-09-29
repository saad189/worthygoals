import { BadRequestException } from '@nestjs/common';

/**
 * Validate a `?limit=` query value. Every list endpoint used to return the
 * user's whole history in one response; this is the bound they share.
 * messages.service had the only bounded list and is where this came from.
 */
export function parseLimit(
  raw: string | number | undefined,
  { fallback, max }: { fallback: number; max: number },
): number {
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0 || n > max) {
    throw new BadRequestException(`limit must be an integer from 1 to ${max}`);
  }
  return n;
}
