import type { Session } from '../models/session';
import {
  evaluateSession,
  isSameCheck,
  nextCheckDelayMs,
  SESSION_TIMINGS,
  type SessionCheck,
  type SessionTimings,
} from './sessionPolicy';

export type EndReason = 'logout' | 'expired' | 'userDeleted';

/** What listeners receive: a new check result, or the end of the session and why. */
export type SessionChange = SessionCheck | { state: 'ended'; reason: EndReason };

export interface SessionStore {
  load(): Promise<Session | null>;
  save(session: Session): Promise<void>;
  clear(): Promise<void>;
}

export interface Timers {
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface SessionControllerDeps {
  clock: () => number;
  store: SessionStore;
  /** Throws when user data is unreadable; the error goes to `onError`. */
  userExists(userId: string): Promise<boolean>;
  timers?: Timers;
  timings?: SessionTimings;
  /** Failures in background work (writes, the user check), so the app can fail closed. */
  onError?(error: unknown): void;
}

/** Touches can come many times a second; storage gets the latest one at most this often. */
export const ACTIVITY_PERSIST_INTERVAL_MS = 15_000;

const globalTimers: Timers = {
  setTimeout: (callback, ms) => setTimeout(callback, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/**
 * Inactivity expiry without React (research R7). Activity lives in memory and reaches storage
 * at most every 15 s, or right away on `flush` (app going to the background). The controller
 * schedules its own checks: at least every 30 s, exactly when the warning starts, and every
 * second while the warning counts down (FR-021 to FR-023, FR-026).
 */
export class SessionController {
  private session: Session | null = null;
  private lastPersistedAt = 0;
  private lastCheck: SessionCheck | null = null;
  private persistTimer: unknown = null;
  private checkTimer: unknown = null;
  private readonly listeners = new Set<(change: SessionChange) => void>();
  private readonly timers: Timers;
  private readonly timings: SessionTimings;

  constructor(private readonly deps: SessionControllerDeps) {
    this.timers = deps.timers ?? globalTimers;
    this.timings = deps.timings ?? SESSION_TIMINGS;
  }

  get userId(): string | undefined {
    return this.session?.userId;
  }

  onChange(listener: (change: SessionChange) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async start(userId: string): Promise<void> {
    this.stopTimers();
    const now = this.deps.clock();
    this.session = { userId, lastActivityAt: now };
    this.lastPersistedAt = now;
    this.lastCheck = null;
    await this.deps.store.save(this.session);
    this.check();
  }

  /** The stored session, if it is still valid and its user still exists; otherwise clears it. */
  async restore(): Promise<Session | null> {
    const stored = await this.deps.store.load();
    if (!stored) return null;
    const valid =
      evaluateSession(stored.lastActivityAt, this.deps.clock(), this.timings).state !== 'expired' &&
      (await this.deps.userExists(stored.userId));
    if (!valid) {
      await this.deps.store.clear();
      return null;
    }
    this.session = stored;
    this.lastPersistedAt = stored.lastActivityAt;
    this.lastCheck = null;
    this.check();
    return stored;
  }

  /** A touch or a screen change (FR-021). An expired session is ended, never revived. */
  recordActivity(): void {
    if (!this.session) return;
    const now = this.deps.clock();
    if (evaluateSession(this.session.lastActivityAt, now, this.timings).state === 'expired') {
      this.check();
      return;
    }
    this.session = { ...this.session, lastActivityAt: now };

    if (this.persistTimer !== null) return; // the pending write will take the latest activity
    const wait = this.lastPersistedAt + ACTIVITY_PERSIST_INTERVAL_MS - now;
    if (wait <= 0) {
      this.persistInBackground();
      return;
    }
    this.persistTimer = this.timers.setTimeout(() => {
      this.persistTimer = null;
      this.persistInBackground();
    }, wait);
  }

  /** Persists the latest activity now (AppState → background). */
  async flush(): Promise<void> {
    this.clearPersistTimer();
    if (!this.session) return;
    this.lastPersistedAt = this.deps.clock();
    await this.deps.store.save(this.session);
  }

  /** Evaluates the session, notifies on visible changes, and schedules the next check. */
  check(): SessionCheck | null {
    if (!this.session) return null;
    const result = evaluateSession(this.session.lastActivityAt, this.deps.clock(), this.timings);
    if (result.state === 'expired') {
      this.end('expired').catch((error: unknown) => this.deps.onError?.(error));
      return result;
    }
    if (!isSameCheck(this.lastCheck, result)) this.emit(result);
    this.lastCheck = result;
    this.scheduleCheck(result);
    return result;
  }

  /** `check` plus the user check: the session ends when its user was deleted (FR-026). */
  async refresh(): Promise<void> {
    const result = this.check();
    const userId = this.session?.userId;
    if (!result || result.state === 'expired' || !userId) return;
    try {
      const exists = await this.deps.userExists(userId);
      if (!exists && this.session?.userId === userId) await this.end('userDeleted');
    } catch (error) {
      this.deps.onError?.(error);
    }
  }

  async end(reason: EndReason): Promise<void> {
    const hadSession = this.session !== null;
    this.session = null;
    this.lastCheck = null;
    this.stopTimers();
    try {
      await this.deps.store.clear();
    } finally {
      if (hadSession) this.emit({ state: 'ended', reason });
    }
  }

  /** Forgets the session without touching storage (data error: the reset screen owns storage). */
  abandon(): void {
    this.session = null;
    this.lastCheck = null;
    this.stopTimers();
  }

  /** Stops every timer and listener (provider unmount). */
  dispose(): void {
    this.stopTimers();
    this.listeners.clear();
  }

  private emit(change: SessionChange): void {
    for (const listener of this.listeners) listener(change);
  }

  private persistInBackground(): void {
    if (!this.session) return;
    this.lastPersistedAt = this.deps.clock();
    this.deps.store.save(this.session).catch((error: unknown) => this.deps.onError?.(error));
  }

  private scheduleCheck(result: SessionCheck): void {
    this.clearCheckTimer();
    const delay = nextCheckDelayMs(result, this.timings);
    if (delay === null) return;
    this.checkTimer = this.timers.setTimeout(() => {
      this.checkTimer = null;
      void this.refresh();
    }, delay);
  }

  private stopTimers(): void {
    this.clearPersistTimer();
    this.clearCheckTimer();
  }

  private clearPersistTimer(): void {
    if (this.persistTimer === null) return;
    this.timers.clearTimeout(this.persistTimer);
    this.persistTimer = null;
  }

  private clearCheckTimer(): void {
    if (this.checkTimer === null) return;
    this.timers.clearTimeout(this.checkTimer);
    this.checkTimer = null;
  }
}
