import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../../src/services/storage';
import {
  ACTIVITY_PERSIST_INTERVAL_MS,
  SessionController,
  type SessionChange,
  type SessionControllerDeps,
} from '../../src/session/SessionController';
import { sessionTimings } from '../../src/session/sessionPolicy';
import { clearSession, loadSession, saveSession } from '../../src/session/session.store';

const T0 = 1_700_000_000_000;
const SECOND = 1_000;

function setup(overrides: Partial<SessionControllerDeps> = {}) {
  const store = {
    load: jest.fn(loadSession),
    save: jest.fn(saveSession),
    clear: jest.fn(clearSession),
  };
  const userExists = jest.fn(async (_id: string) => true);
  const onError = jest.fn();
  const controller = new SessionController({
    clock: () => Date.now(),
    store,
    userExists,
    onError,
    timings: sessionTimings(false),
    ...overrides,
  });
  const changes: SessionChange[] = [];
  const unsubscribe = controller.onChange((change) => changes.push(change));
  return { controller, store, userExists, onError, changes, unsubscribe };
}

const stored = async () => JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.session)) ?? 'null');
const advance = (ms: number) => jest.advanceTimersByTimeAsync(ms);

beforeEach(async () => {
  jest.useFakeTimers({ now: T0 });
  await AsyncStorage.clear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('start', () => {
  it('persists the session and reports it as active', async () => {
    const { controller, changes } = setup();
    await controller.start('u1');
    await expect(stored()).resolves.toEqual({ userId: 'u1', lastActivityAt: T0 });
    expect(controller.userId).toBe('u1');
    expect(changes).toEqual([{ state: 'active', msLeft: 300_000, minutesLeft: 5 }]);
    controller.dispose();
  });
});

describe('recordActivity', () => {
  it('moves the expiry forward in memory', async () => {
    const { controller } = setup();
    await controller.start('u1');
    await advance(250 * SECOND);
    controller.recordActivity();
    expect(controller.check()).toEqual({ state: 'active', msLeft: 300_000, minutesLeft: 5 });
    controller.dispose();
  });

  it('persists at most every 15 s, and always persists the latest activity', async () => {
    const { controller, store } = setup();
    await controller.start('u1');
    expect(ACTIVITY_PERSIST_INTERVAL_MS).toBe(15_000);
    expect(store.save).toHaveBeenCalledTimes(1);

    await advance(1 * SECOND);
    controller.recordActivity();
    await advance(4 * SECOND);
    controller.recordActivity(); // T0 + 5 s
    expect(store.save).toHaveBeenCalledTimes(1);

    await advance(10 * SECOND); // T0 + 15 s
    expect(store.save).toHaveBeenCalledTimes(2);
    await expect(stored()).resolves.toEqual({ userId: 'u1', lastActivityAt: T0 + 5 * SECOND });

    await advance(5 * SECOND);
    controller.recordActivity(); // T0 + 20 s, only 5 s after the last write
    await advance(9 * SECOND);
    expect(store.save).toHaveBeenCalledTimes(2);
    await advance(1 * SECOND); // T0 + 30 s
    expect(store.save).toHaveBeenCalledTimes(3);

    await advance(20 * SECOND);
    controller.recordActivity(); // T0 + 50 s, 20 s after the last write: immediate
    await advance(0);
    expect(store.save).toHaveBeenCalledTimes(4);
    await expect(stored()).resolves.toEqual({ userId: 'u1', lastActivityAt: T0 + 50 * SECOND });
    controller.dispose();
  });

  it('does nothing without a session', () => {
    const { controller, store } = setup();
    controller.recordActivity();
    expect(store.save).not.toHaveBeenCalled();
    expect(controller.check()).toBeNull();
  });

  it('never revives an expired session', async () => {
    const { controller, changes } = setup();
    await controller.start('u1');
    jest.setSystemTime(T0 + 301 * SECOND);
    controller.recordActivity();
    await advance(0);
    expect(changes.at(-1)).toEqual({ state: 'ended', reason: 'expired' });
    expect(controller.check()).toBeNull();
    await expect(stored()).resolves.toBeNull();
  });
});

describe('flush', () => {
  it('persists the latest activity now and cancels the pending write', async () => {
    const { controller, store } = setup();
    await controller.start('u1');
    await advance(2 * SECOND);
    controller.recordActivity();
    await controller.flush();
    expect(store.save).toHaveBeenCalledTimes(2);
    await expect(stored()).resolves.toEqual({ userId: 'u1', lastActivityAt: T0 + 2 * SECOND });
    await advance(15 * SECOND);
    expect(store.save).toHaveBeenCalledTimes(2);
    controller.dispose();
  });

  it('does nothing without a session', async () => {
    const { controller, store } = setup();
    await controller.flush();
    expect(store.save).not.toHaveBeenCalled();
  });
});

describe('restore', () => {
  it('returns null when no session is stored', async () => {
    const { controller } = setup();
    await expect(controller.restore()).resolves.toBeNull();
  });

  it('resumes a valid session and reports it', async () => {
    await saveSession({ userId: 'u1', lastActivityAt: T0 - 70 * SECOND });
    const { controller, changes } = setup();
    await expect(controller.restore()).resolves.toEqual({ userId: 'u1', lastActivityAt: T0 - 70 * SECOND });
    expect(controller.userId).toBe('u1');
    expect(changes).toEqual([{ state: 'active', msLeft: 230_000, minutesLeft: 3 }]);
    controller.dispose();
  });

  it('returns null and clears the store when the session already expired', async () => {
    await saveSession({ userId: 'u1', lastActivityAt: T0 - 300 * SECOND });
    const { controller } = setup();
    await expect(controller.restore()).resolves.toBeNull();
    await expect(stored()).resolves.toBeNull();
  });

  it('returns null and clears the store when the user no longer exists', async () => {
    await saveSession({ userId: 'gone', lastActivityAt: T0 });
    const { controller, userExists } = setup();
    userExists.mockResolvedValue(false);
    await expect(controller.restore()).resolves.toBeNull();
    expect(userExists).toHaveBeenCalledWith('gone');
    await expect(stored()).resolves.toBeNull();
  });

  it('treats a corrupt stored session as none and removes it', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.session, '{"userId":""}');
    const { controller } = setup();
    await expect(controller.restore()).resolves.toBeNull();
    await expect(AsyncStorage.getItem(STORAGE_KEYS.session)).resolves.toBeNull();
  });
});

describe('check', () => {
  it('goes active → warning (counting down) → expired, then ends the session', async () => {
    const { controller, changes } = setup();
    await controller.start('u1');

    await advance(240 * SECOND);
    expect(changes.at(-1)).toEqual({ state: 'warning', msLeft: 60_000, secondsLeft: 60 });

    await advance(1 * SECOND);
    expect(changes.at(-1)).toEqual({ state: 'warning', msLeft: 59_000, secondsLeft: 59 });

    await advance(59 * SECOND);
    expect(changes.at(-1)).toEqual({ state: 'ended', reason: 'expired' });
    await expect(stored()).resolves.toBeNull();

    const states = changes.map((c) => c.state);
    expect(states.indexOf('warning')).toBeGreaterThan(states.lastIndexOf('active'));
    expect(changes.filter((c) => c.state === 'warning')).toHaveLength(60);
    // Every notification shows something new.
    expect(new Set(changes.map((c) => JSON.stringify({ ...c, msLeft: undefined }))).size).toBe(changes.length);
  });

  it('checks at least every 30 s while active (FR-022)', async () => {
    const { controller, userExists } = setup();
    await controller.start('u1');
    await advance(30 * SECOND);
    expect(userExists).toHaveBeenCalledTimes(1);
    await advance(30 * SECOND);
    expect(userExists).toHaveBeenCalledTimes(2);
    controller.dispose();
  });

  it('detects expiry when called after the timers were paused (app back from background)', async () => {
    const { controller, changes } = setup();
    await controller.start('u1');
    jest.setSystemTime(T0 + 600 * SECOND);
    expect(controller.check()).toEqual({ state: 'expired' });
    await advance(0);
    expect(changes.at(-1)).toEqual({ state: 'ended', reason: 'expired' });
  });

  it('treats a clock moved back as expired', async () => {
    const { controller } = setup();
    await controller.start('u1');
    jest.setSystemTime(T0 - SECOND);
    expect(controller.check()).toEqual({ state: 'expired' });
  });

  it('closes the warning after keep-alive activity', async () => {
    const { controller, changes } = setup();
    await controller.start('u1');
    await advance(250 * SECOND);
    controller.recordActivity();
    controller.check();
    expect(changes.at(-1)).toEqual({ state: 'active', msLeft: 300_000, minutesLeft: 5 });
    controller.dispose();
  });
});

describe('refresh (FR-026)', () => {
  it('ends the session when the signed-in user was deleted', async () => {
    const { controller, userExists, changes } = setup();
    await controller.start('u1');
    userExists.mockResolvedValue(false);
    await controller.refresh();
    expect(changes.at(-1)).toEqual({ state: 'ended', reason: 'userDeleted' });
    await expect(stored()).resolves.toBeNull();
  });

  it('reports a failing user check (corrupt data) through onError', async () => {
    const { controller, userExists, onError } = setup();
    await controller.start('u1');
    const failure = new Error('corrupt');
    userExists.mockRejectedValue(failure);
    await controller.refresh();
    expect(onError).toHaveBeenCalledWith(failure);
    controller.dispose();
  });

  it('does nothing without a session', async () => {
    const { controller, userExists } = setup();
    await controller.refresh();
    expect(userExists).not.toHaveBeenCalled();
  });
});

describe('end', () => {
  it.each(['logout', 'expired', 'userDeleted'] as const)('clears the store and reports "%s"', async (reason) => {
    const { controller, changes } = setup();
    await controller.start('u1');
    await controller.end(reason);
    await expect(stored()).resolves.toBeNull();
    expect(controller.userId).toBeUndefined();
    expect(changes.at(-1)).toEqual({ state: 'ended', reason });
  });

  it('stops the timers, so nothing else is reported', async () => {
    const { controller, changes, userExists } = setup();
    await controller.start('u1');
    await controller.end('logout');
    const count = changes.length;
    await advance(600 * SECOND);
    expect(changes).toHaveLength(count);
    expect(userExists).not.toHaveBeenCalled();
  });

  it('reports only once when called without a session', async () => {
    const { controller, changes } = setup();
    await controller.end('logout');
    expect(changes).toEqual([]);
  });
});

describe('errors and listeners', () => {
  it('reports a failed background write through onError', async () => {
    const { controller, store, onError } = setup();
    await controller.start('u1');
    const failure = new Error('disk full');
    store.save.mockRejectedValueOnce(failure);
    await advance(20 * SECOND);
    controller.recordActivity();
    await advance(0);
    expect(onError).toHaveBeenCalledWith(failure);
    controller.dispose();
  });

  it('reports a failed clear on expiry through onError', async () => {
    const { controller, store, onError, changes } = setup();
    await controller.start('u1');
    const failure = new Error('disk');
    store.clear.mockRejectedValueOnce(failure);
    await advance(300 * SECOND);
    expect(onError).toHaveBeenCalledWith(failure);
    expect(changes.at(-1)).toEqual({ state: 'ended', reason: 'expired' });
  });

  it('stops notifying after unsubscribe and after dispose', async () => {
    const { controller, changes, unsubscribe } = setup();
    unsubscribe();
    await controller.start('u1');
    expect(changes).toEqual([]);

    const other: SessionChange[] = [];
    controller.onChange((c) => other.push(c));
    controller.dispose();
    await advance(600 * SECOND);
    expect(other).toEqual([]);
  });

  it('uses the global timers and the default production-safe options when none are given', async () => {
    const controller = new SessionController({
      clock: () => Date.now(),
      store: { load: loadSession, save: saveSession, clear: clearSession },
      userExists: async () => true,
    });
    await controller.start('u1');
    expect(controller.check()?.state).toBe('active');
    controller.recordActivity();
    controller.dispose();
  });
});

describe('abandon (data error)', () => {
  it('forgets the session and stops the timers, leaving storage alone', async () => {
    const { controller, changes, userExists } = setup();
    await controller.start('u1');
    const count = changes.length;
    controller.abandon();
    expect(controller.userId).toBeUndefined();
    await advance(600 * SECOND);
    expect(changes).toHaveLength(count);
    expect(userExists).not.toHaveBeenCalled();
    await expect(stored()).resolves.toEqual({ userId: 'u1', lastActivityAt: T0 });
  });
});
