import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { UserInput, UserView } from '../models/user';
import type { SignInResult } from '../services/auth.service';
import { createAppServices } from '../services/container';
import { expoCryptoAdapter } from '../services/expoCrypto.adapter';
import { CorruptDataError, FirstUserNotAllowedError, type SaveUserResult } from '../services/user.repo';
import { resolveBootStatus } from '../session/bootStatus';
import { clearSession, loadSession, saveSession } from '../session/session.store';

export type SessionStatus = 'loading' | 'dataError' | 'signedOut' | 'signedIn';

export interface SessionContextValue {
  status: SessionStatus;
  /** False only while no user has ever been created ("Criar primeiro usuário"). */
  usersExist: boolean;
  userId?: string;
  signIn(username: string, password: string): Promise<SignInResult>;
  createFirstUser(input: UserInput): Promise<SaveUserResult>;
  /** Users without credentials, for the list screen (FR-030). Corrupt data fails closed. */
  listUsers(): Promise<UserView[]>;
  /** Signed-in creation of another user. */
  createUser(input: UserInput): Promise<SaveUserResult>;
  signOut(): Promise<void>;
}

interface State {
  status: SessionStatus;
  usersExist: boolean;
  userId?: string;
}

const services = createAppServices(expoCryptoAdapter);
const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Thin React adapter (research R7): every decision lives in src/session and src/services.
 * Inactivity expiry is wired in US5 (T053).
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading', usersExist: false });

  /** Any unexpected storage failure fails closed to the data error screen (FR-031). */
  const failClosed = useCallback(() => setState({ status: 'dataError', usersExist: true }), []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const boot = resolveBootStatus(await services.users.loadUsers(), await loadSession());
        if (boot.clearSession) await clearSession();
        if (active) setState({ status: boot.status, usersExist: boot.usersExist, userId: boot.userId });
      } catch {
        if (active) failClosed();
      }
    })();
    return () => {
      active = false;
    };
  }, [failClosed]);

  const startSession = useCallback(async (userId: string) => {
    await saveSession({ userId, lastActivityAt: Date.now() });
    setState({ status: 'signedIn', usersExist: true, userId });
  }, []);

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
          setState({ status: 'signedOut', usersExist: true });
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

  const signOut = useCallback(async () => {
    await clearSession();
    setState({ status: 'signedOut', usersExist: true });
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ ...state, signIn, createFirstUser, listUsers, createUser, signOut }),
    [state, signIn, createFirstUser, listUsers, createUser, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
