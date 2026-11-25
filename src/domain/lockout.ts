import type { LoginAttemptMap, LoginAttemptRecord } from '../models/loginAttempt';

export const MAX_FAILURES = 5;
export const BASE_LOCK_MS = 30_000;
export const MAX_LOCK_MS = 300_000;

const EMPTY: LoginAttemptRecord = { failures: 0, lockouts: 0, lockedUntil: null };

/**
 * Records one failed sign-in (FR-006). The 5th consecutive failure locks the username for
 * 30 s × 2^(lockouts−1), capped at 5 min, and resets the failure count.
 */
export function registerFailure(record: LoginAttemptRecord | undefined, now: number): LoginAttemptRecord {
  const current = record ?? EMPTY;
  const failures = current.failures + 1;
  if (failures < MAX_FAILURES) return { ...current, failures };

  const lockouts = current.lockouts + 1;
  const duration = Math.min(BASE_LOCK_MS * 2 ** (lockouts - 1), MAX_LOCK_MS);
  return { failures: 0, lockouts, lockedUntil: now + duration };
}

/** Seconds left on the lock, rounded up; 0 when not locked. */
export function lockRemainingSeconds(record: LoginAttemptRecord | undefined, now: number): number {
  if (!record || record.lockedUntil === null || record.lockedUntil <= now) return 0;
  return Math.ceil((record.lockedUntil - now) / 1000);
}

/** Drops records with no failures and no active lock, bounding storage growth (data-model.md). */
export function pruneAttempts(map: LoginAttemptMap, now: number): LoginAttemptMap {
  return Object.fromEntries(
    Object.entries(map).filter(
      ([, record]) => record.failures > 0 || (record.lockedUntil !== null && record.lockedUntil > now),
    ),
  );
}
