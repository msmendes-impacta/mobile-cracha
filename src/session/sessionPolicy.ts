/** How long a session survives without activity, and when it warns first (FR-021 to FR-023). */
export interface SessionTimings {
  idleTimeoutMs: number;
  warningMs: number;
  /** Expiry is checked at least this often while the app is in use (FR-022). */
  maxCheckIntervalMs: number;
}

export function sessionTimings(dev: boolean): SessionTimings {
  return dev
    ? { idleTimeoutMs: 30_000, warningMs: 10_000, maxCheckIntervalMs: 30_000 }
    : { idleTimeoutMs: 300_000, warningMs: 60_000, maxCheckIntervalMs: 30_000 };
}

/** Development builds use short timings so the demo script can show expiry quickly. */
export const SESSION_TIMINGS = sessionTimings(__DEV__);
export const SESSION_IDLE_TIMEOUT_MS = SESSION_TIMINGS.idleTimeoutMs;
export const SESSION_WARNING_MS = SESSION_TIMINGS.warningMs;

export type SessionCheck =
  | { state: 'active'; msLeft: number; minutesLeft: number }
  | { state: 'warning'; msLeft: number; secondsLeft: number }
  | { state: 'expired' };

const MINUTE = 60_000;
const SECOND = 1_000;

/**
 * Where a session stands. A negative elapsed time means the clock moved back, which
 * counts as expired so nobody gains time by changing the device clock.
 */
export function evaluateSession(
  lastActivityAt: number,
  now: number,
  timings: SessionTimings = SESSION_TIMINGS,
): SessionCheck {
  const elapsed = now - lastActivityAt;
  if (elapsed < 0 || elapsed >= timings.idleTimeoutMs) return { state: 'expired' };

  const msLeft = timings.idleTimeoutMs - elapsed;
  if (msLeft <= timings.warningMs) return { state: 'warning', msLeft, secondsLeft: Math.ceil(msLeft / SECOND) };
  return { state: 'active', msLeft, minutesLeft: Math.floor(msLeft / MINUTE) };
}

/** Time until something on screen changes: the warning, a minute or second tick, or the 30 s floor. */
export function nextCheckDelayMs(check: SessionCheck, timings: SessionTimings = SESSION_TIMINGS): number | null {
  if (check.state === 'expired') return null;
  if (check.state === 'warning') return check.msLeft % SECOND || SECOND;
  // minutesLeft is floored, so it drops 1 ms after each whole minute.
  return Math.min(timings.maxCheckIntervalMs, check.msLeft - timings.warningMs, (check.msLeft % MINUTE) + 1);
}

/** True when both checks show the same thing, so listeners are not notified for nothing. */
export function isSameCheck(previous: SessionCheck | null, next: SessionCheck): boolean {
  if (!previous || previous.state !== next.state) return false;
  if (previous.state === 'active' && next.state === 'active') return previous.minutesLeft === next.minutesLeft;
  if (previous.state === 'warning' && next.state === 'warning') return previous.secondsLeft === next.secondsLeft;
  return true;
}
