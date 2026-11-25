import {
  evaluateSession,
  isSameCheck,
  nextCheckDelayMs,
  sessionTimings,
  type SessionTimings,
} from '../../src/session/sessionPolicy';

const T0 = 1_700_000_000_000;
/** Production timings: 5 min idle timeout, 60 s warning, checks at least every 30 s. */
const prod: SessionTimings = sessionTimings(false);
const at = (elapsedMs: number) => evaluateSession(T0, T0 + elapsedMs, prod);

describe('sessionTimings', () => {
  it('uses 5 min / 60 s in production builds (FR-021, FR-023)', () => {
    expect(sessionTimings(false)).toEqual({ idleTimeoutMs: 300_000, warningMs: 60_000, maxCheckIntervalMs: 30_000 });
  });

  it('uses 30 s / 10 s in development builds', () => {
    expect(sessionTimings(true)).toEqual({ idleTimeoutMs: 30_000, warningMs: 10_000, maxCheckIntervalMs: 30_000 });
  });

  it('exports constants that follow __DEV__', () => {
    const g = globalThis as { __DEV__?: boolean };
    const original = g.__DEV__;
    try {
      for (const dev of [true, false]) {
        g.__DEV__ = dev;
        jest.isolateModules(() => {
          // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules needs a sync load
          const policy = require('../../src/session/sessionPolicy');
          expect(policy.SESSION_IDLE_TIMEOUT_MS).toBe(dev ? 30_000 : 300_000);
          expect(policy.SESSION_WARNING_MS).toBe(dev ? 10_000 : 60_000);
        });
      }
    } finally {
      g.__DEV__ = original;
    }
  });
});

describe('evaluateSession', () => {
  it('is active right after activity, with the whole minutes left', () => {
    expect(at(0)).toEqual({ state: 'active', msLeft: 300_000, minutesLeft: 5 });
    expect(at(1)).toEqual({ state: 'active', msLeft: 299_999, minutesLeft: 4 });
  });

  it('is still active just before the warning', () => {
    expect(at(239_999)).toEqual({ state: 'active', msLeft: 60_001, minutesLeft: 1 });
  });

  it('warns exactly at the warning boundary', () => {
    expect(at(240_000)).toEqual({ state: 'warning', msLeft: 60_000, secondsLeft: 60 });
  });

  it('rounds the seconds left up mid-warning', () => {
    expect(at(270_500)).toEqual({ state: 'warning', msLeft: 29_500, secondsLeft: 30 });
    expect(at(299_999)).toEqual({ state: 'warning', msLeft: 1, secondsLeft: 1 });
  });

  it('expires exactly at the timeout and after it', () => {
    expect(at(300_000)).toEqual({ state: 'expired' });
    expect(at(900_000)).toEqual({ state: 'expired' });
  });

  it('treats a clock that moved back as expired', () => {
    expect(at(-1)).toEqual({ state: 'expired' });
  });

  it('uses the development timings when given', () => {
    const dev = sessionTimings(true);
    expect(evaluateSession(T0, T0 + 19_999, dev).state).toBe('active');
    expect(evaluateSession(T0, T0 + 20_000, dev)).toEqual({ state: 'warning', msLeft: 10_000, secondsLeft: 10 });
    expect(evaluateSession(T0, T0 + 30_000, dev).state).toBe('expired');
  });
});

describe('nextCheckDelayMs', () => {
  it('never waits more than 30 s while active (FR-022)', () => {
    expect(nextCheckDelayMs(at(1), prod)).toBe(30_000);
  });

  it('wakes up when the floored minutes drop, so the validity line stays right', () => {
    // Exactly 5 min left: the label drops to 4 min 1 ms later.
    expect(nextCheckDelayMs(at(0), prod)).toBe(1);
    // 4 min 50 s left: the label changes in 50 s, but 30 s comes first.
    expect(nextCheckDelayMs(at(10_000), prod)).toBe(30_000);
    // 4 min 10 s left: the label changes from 4 to 3 min in 10 s + 1 ms.
    expect(nextCheckDelayMs(at(50_000), prod)).toBe(10_001);
    expect(evaluateSession(T0, T0 + 60_001, prod)).toMatchObject({ minutesLeft: 3 });
  });

  it('wakes up exactly when the warning starts', () => {
    // 1 min 5 s left: the warning is due in 5 s.
    expect(nextCheckDelayMs(at(235_000), prod)).toBe(5_000);
  });

  it('ticks on each second boundary while warning', () => {
    expect(nextCheckDelayMs(at(240_000), prod)).toBe(1_000);
    expect(nextCheckDelayMs(at(270_500), prod)).toBe(500);
  });

  it('stops once expired', () => {
    expect(nextCheckDelayMs(at(300_000), prod)).toBeNull();
  });

  it('wakes up at the warning in development builds too', () => {
    const dev = sessionTimings(true);
    expect(nextCheckDelayMs(evaluateSession(T0, T0 + 1, dev), dev)).toBe(19_999);
  });
});

describe('isSameCheck', () => {
  it('compares what the screen shows, not the milliseconds', () => {
    expect(isSameCheck(at(1), at(2))).toBe(true);
    expect(isSameCheck(at(0), at(1))).toBe(false);
    expect(isSameCheck(at(240_000), at(240_500))).toBe(true);
    expect(isSameCheck(at(240_000), at(241_000))).toBe(false);
    expect(isSameCheck(at(239_999), at(240_000))).toBe(false);
    expect(isSameCheck(at(300_000), at(400_000))).toBe(true);
  });

  it('treats a missing previous check as a change', () => {
    expect(isSameCheck(null, at(0))).toBe(false);
  });
});

describe('defaults', () => {
  it('uses the build timings when none are given', () => {
    const check = evaluateSession(T0, T0);
    expect(check.state).toBe('active');
    expect(nextCheckDelayMs(check)).toBeGreaterThan(0);
  });
});
