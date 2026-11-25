import { createContext, useContext, type ReactNode } from 'react';

export type SessionStatus = 'loading' | 'dataError' | 'signedOut' | 'signedIn';

export interface SessionContextValue {
  status: SessionStatus;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Thin React adapter over the session rules in src/session (research R7).
 * Phase 2 skeleton: boot resolution arrives in US1 (T030b) and expiry in US5 (T053).
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  return <SessionContext.Provider value={{ status: 'loading' }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
