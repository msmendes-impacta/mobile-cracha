import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import type { UserInput, UserView } from '../models/user';
import type { SignInResult } from '../services/auth.service';
import { createAppServices } from '../services/container';
import { expoCryptoAdapter } from '../services/expoCrypto.adapter';
import {
  CorruptDataError,
  FirstUserNotAllowedError,
  SelfDeleteError,
  UserNotFoundError,
  type SaveUserResult,
} from '../services/user.repo';
import { resolveBootStatus } from '../session/bootStatus';
import { SessionController, type SessionChange } from '../session/SessionController';
import { clearSession, loadSession, saveSession } from '../session/session.store';

export type SessionStatus = 'loading' | 'dataError' | 'signedOut' | 'signedIn';

export interface SessionContextValue {
  status: SessionStatus;
  /** False only while no user has ever been created ("Criar primeiro usuário"). */
  usersExist: boolean;
  userId?: string;
  /** Seconds left while the inactivity warning is showing (FR-023); undefined otherwise. */
  warningSecondsLeft?: number;
  /** Whole minutes until expiry, for the SessionBadge validity line. */
  validMinutesLeft?: number;
  /** The last session ended by inactivity: the login shows the notice (FR-024). */
  expiredNotice: boolean;
  signIn(username: string, password: string): Promise<SignInResult>;
  createFirstUser(input: UserInput): Promise<SaveUserResult>;
  /** Users without credentials, for the list screen (FR-030). Corrupt data fails closed. */
  listUsers(): Promise<UserView[]>;
  /** Signed-in creation of another user. */
  createUser(input: UserInput): Promise<SaveUserResult>;
  /** The user to edit, without credentials; undefined when it no longer exists. */
  getUser(id: string): Promise<UserView | undefined>;
  /** Edit; resolves to `notFound` when the user was removed meanwhile. */
  updateUser(id: string, input: UserInput): Promise<SaveUserResult | { ok: false; notFound: true }>;
  /** Deletes another user (FR-018); false when refused (own record or no session). */
  deleteUser(id: string): Promise<boolean>;
  signOut(): Promise<void>;
  /** "Continuar conectado": counts as activity and closes the warning. */
  keepAlive(): void;
  /** A touch or a screen change (FR-021). Cheap; safe to call on every touch. */
  recordActivity(): void;
}

type State = Pick<
  SessionContextValue,
  'status' | 'usersExist' | 'userId' | 'warningSecondsLeft' | 'validMinutesLeft' | 'expiredNotice'
>;

const services = createAppServices(expoCryptoAdapter);
const SessionContext = createContext<SessionContextValue | null>(null);

const DATA_ERROR: State = { status: 'dataError', usersExist: true, expiredNotice: false };

/** Applies a controller notification. A data error is final until the reset (FR-031). */
function applyChange(state: State, change: SessionChange): State {
  if (state.status === 'dataError') return state;
  switch (change.state) {
    case 'ended':
      return { status: 'signedOut', usersExist: true, expiredNotice: change.reason === 'expired' };
    case 'warning':
      return { ...state, warningSecondsLeft: change.secondsLeft, validMinutesLeft: 0 };
    case 'active':
      return { ...state, warningSecondsLeft: undefined, validMinutesLeft: change.minutesLeft };
    default:
      return state; // 'expired' is always followed by 'ended'
  }
}

/**
 * Thin React adapter (research R7): every decision lives in src/session and src/services.
 * The SessionController owns expiry and its timers; this provider forwards app state and
 * touches to it and mirrors its notifications into React state.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading', usersExist: false, expiredNotice: false });
  const [controller] = useState(() => {
    const created: SessionController = new SessionController({
      clock: Date.now,
      store: { load: loadSession, save: saveSession, clear: clearSession },
      userExists: async (id) => (await services.users.getById(id)) !== undefined,
      // Unreadable users fail closed. A lost activity write only makes the session end sooner.
      onError: (error) => {
        if (!(error instanceof CorruptDataError)) return;
        created.abandon();
        setState(DATA_ERROR);
      },
    });
    return created;
  });

  /** Any unexpected storage failure fails closed to the data error screen (FR-031). */
  const failClosed = useCallback(() => {
    controller.abandon();
    setState(DATA_ERROR);
  }, [controller]);

  useEffect(() => {
    const unsubscribe = controller.onChange((change) => setState((current) => applyChange(current, change)));
    return () => {
      unsubscribe();
      controller.dispose();
    };
  }, [controller]);

  // Checks on return from the background; persists activity before leaving it (FR-022).
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void controller.refresh();
      else controller.flush().catch(() => undefined);
    });
    return () => subscription.remove();
  }, [controller]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const users = await services.users.loadUsers();
        // Only readable users can validate a stored session; otherwise it waits for the reset.
        const session = users.status === 'ok' ? await controller.restore() : await loadSession();
        const boot = resolveBootStatus(users, session);
        if (boot.clearSession) await clearSession();
        if (active) {
          setState((current) => ({
            ...current,
            status: boot.status,
            usersExist: boot.usersExist,
            userId: boot.userId,
          }));
        }
      } catch {
        if (active) failClosed();
      }
    })();
    return () => {
      active = false;
    };
  }, [controller, failClosed]);

  const startSession = useCallback(
    async (userId: string) => {
      await controller.start(userId);
      setState((current) => ({ ...current, status: 'signedIn', usersExist: true, userId, expiredNotice: false }));
    },
    [controller],
  );

  const signIn = useCallback(
    async (username: string, password: string): Promise<SignInResult> => {
      try {
        const result = await services.auth.signIn(username, password, Date.now());
        if (result.status === 'ok') await startSession(result.userId);
        return result;
      } catch (error) {
        if (!(error instanceof CorruptDataError)) throw error;
        failClosed();
        return { status: 'invalid' };
      }
    },
    [startSession, failClosed],
  );

  const createFirstUser = useCallback(
    async (input: UserInput): Promise<SaveUserResult> => {
      try {
        const result = await services.users.createFirstUser(input);
        if (result.ok) await startSession(result.user.id);
        return result;
      } catch (error) {
        if (error instanceof FirstUserNotAllowedError) {
          // Someone already exists: first access is closed, back to the normal login.
          setState({ status: 'signedOut', usersExist: true, expiredNotice: false });
          return { ok: false, errors: {} };
        }
        failClosed();
        return { ok: false, errors: {} };
      }
    },
    [startSession, failClosed],
  );

  const listUsers = useCallback(async (): Promise<UserView[]> => {
    try {
      return await services.users.listUserViews();
    } catch {
      failClosed();
      return [];
    }
  }, [failClosed]);

  const createUser = useCallback(
    async (input: UserInput): Promise<SaveUserResult> => {
      try {
        return await services.users.createUser(input);
      } catch {
        failClosed();
        return { ok: false, errors: {} };
      }
    },
    [failClosed],
  );

  const getUser = useCallback(
    async (id: string): Promise<UserView | undefined> => {
      try {
        return await services.users.getById(id);
      } catch {
        failClosed();
        return undefined;
      }
    },
    [failClosed],
  );

  const updateUser = useCallback(
    async (id: string, input: UserInput): Promise<SaveUserResult | { ok: false; notFound: true }> => {
      try {
        return await services.users.updateUser(id, input);
      } catch (error) {
        if (error instanceof UserNotFoundError) return { ok: false, notFound: true };
        failClosed();
        return { ok: false, errors: {} };
      }
    },
    [failClosed],
  );

  const { userId } = state;
  const deleteUser = useCallback(
    async (id: string): Promise<boolean> => {
      if (!userId) return false;
      try {
        await services.users.deleteUser(id, userId);
        return true;
      } catch (error) {
        if (error instanceof SelfDeleteError) return false;
        failClosed();
        return false;
      }
    },
    [userId, failClosed],
  );

  const signOut = useCallback(async () => {
    try {
      await controller.end('logout');
    } catch {
      failClosed();
    }
  }, [controller, failClosed]);

  const keepAlive = useCallback(() => {
    controller.recordActivity();
    controller.check();
  }, [controller]);

  const recordActivity = useCallback(() => controller.recordActivity(), [controller]);

  const value = useMemo<SessionContextValue>(
    () => ({
      ...state,
      signIn,
      createFirstUser,
      listUsers,
      createUser,
      getUser,
      updateUser,
      deleteUser,
      signOut,
      keepAlive,
      recordActivity,
    }),
    [
      state,
      signIn,
      createFirstUser,
      listUsers,
      createUser,
      getUser,
      updateUser,
      deleteUser,
      signOut,
      keepAlive,
      recordActivity,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
