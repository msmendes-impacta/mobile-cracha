import {
  BASE_LOCK_MS,
  lockRemainingSeconds,
  MAX_FAILURES,
  MAX_LOCK_MS,
  pruneAttempts,
  registerFailure,
} from '../../src/domain/lockout';
import type { LoginAttemptRecord } from '../../src/models/loginAttempt';

const T0 = 1_000_000;

function failTimes(times: number, start?: LoginAttemptRecord, now = T0): LoginAttemptRecord {
  let record = start;
  for (let i = 0; i < times; i += 1) record = registerFailure(record, now);
  return record!;
}

describe('registerFailure', () => {
  it('uses the agreed constants', () => {
    expect(MAX_FAILURES).toBe(5);
    expect(BASE_LOCK_MS).toBe(30_000);
    expect(MAX_LOCK_MS).toBe(300_000);
  });

  it('does not lock for failures 1 to 4', () => {
    const record = failTimes(4);
    expect(record).toEqual({ failures: 4, lockouts: 0, lockedUntil: null });
    expect(lockRemainingSeconds(record, T0)).toBe(0);
  });

  it('locks for 30 s on the 5th failure and resets the failure count', () => {
    const record = failTimes(5);
    expect(record).toEqual({ failures: 0, lockouts: 1, lockedUntil: T0 + 30_000 });
    expect(lockRemainingSeconds(record, T0)).toBe(30);
  });

  it('doubles the lock on each new lockout, capped at 5 minutes', () => {
    const durations: number[] = [];
    let record: LoginAttemptRecord | undefined;
    for (let lockout = 0; lockout < 6; lockout += 1) {
      record = failTimes(5, record);
      durations.push(record.lockedUntil! - T0);
    }
    expect(durations).toEqual([30_000, 60_000, 120_000, 240_000, 300_000, 300_000]);
  });
});

describe('lockRemainingSeconds', () => {
  it('returns 0 for an unknown username', () => {
    expect(lockRemainingSeconds(undefined, T0)).toBe(0);
  });

  it('rounds up partial seconds and returns 0 once the lock has passed', () => {
    const record: LoginAttemptRecord = { failures: 0, lockouts: 1, lockedUntil: T0 + 1_500 };
    expect(lockRemainingSeconds(record, T0)).toBe(2);
    expect(lockRemainingSeconds(record, T0 + 1_500)).toBe(0);
    expect(lockRemainingSeconds(record, T0 + 9_999)).toBe(0);
  });
});

describe('pruneAttempts', () => {
  it('keeps records with failures or an active lock and drops idle expired ones', () => {
    const map = {
      active: { failures: 0, lockouts: 1, lockedUntil: T0 + 10 },
      failing: { failures: 2, lockouts: 0, lockedUntil: null },
      expired: { failures: 0, lockouts: 3, lockedUntil: T0 - 1 },
      empty: { failures: 0, lockouts: 0, lockedUntil: null },
    };
    expect(Object.keys(pruneAttempts(map, T0)).sort()).toEqual(['active', 'failing']);
  });
});
