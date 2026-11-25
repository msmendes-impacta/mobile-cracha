/** Failed sign-in tracking for one normalized username (known or unknown). */
export interface LoginAttemptRecord {
  /** Consecutive failures since the last lockout or success (0–4 at rest). */
  failures: number;
  /** Lockouts applied so far; drives the doubling of the lock duration. */
  lockouts: number;
  /** Epoch ms until which the username is locked, or null. */
  lockedUntil: number | null;
}

export type LoginAttemptMap = Record<string, LoginAttemptRecord>;

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isRecord(value: unknown): value is LoginAttemptRecord {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    isCount(v.failures) &&
    isCount(v.lockouts) &&
    (v.lockedUntil === null || (typeof v.lockedUntil === 'number' && Number.isFinite(v.lockedUntil)))
  );
}

export function isAttemptMap(value: unknown): value is LoginAttemptMap {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.values(value).every(isRecord);
}
