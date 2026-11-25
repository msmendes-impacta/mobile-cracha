import type { Session } from '../models/session';
import type { User } from '../models/user';
import type { ReadResult } from '../services/storage';

export interface BootStatus {
  status: 'dataError' | 'signedOut' | 'signedIn';
  /** False only when users were never stored: the one case that offers "Criar primeiro usuário". */
  usersExist: boolean;
  userId?: string;
  /** The stored session must be removed (stray or pointing to a missing user). */
  clearSession: boolean;
}

/** Decides what the app shows on launch (constitution III/IV: a pure, tested rule). */
export function resolveBootStatus(users: ReadResult<User[]>, session: Session | null): BootStatus {
  if (users.status === 'corrupt') return { status: 'dataError', usersExist: true, clearSession: false };
  if (users.status === 'absent') return { status: 'signedOut', usersExist: false, clearSession: session !== null };

  if (!session) return { status: 'signedOut', usersExist: true, clearSession: false };
  const exists = users.value.some((u) => u.id === session.userId);
  return exists
    ? { status: 'signedIn', usersExist: true, userId: session.userId, clearSession: false }
    : { status: 'signedOut', usersExist: true, clearSession: true };
}
