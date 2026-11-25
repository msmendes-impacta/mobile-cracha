import { isSession, type Session } from '../models/session';
import { readJson, removeKey, STORAGE_KEYS, writeJson } from '../services/storage';

/** Absent or corrupt session reads as signed out; a corrupt record is removed. */
export async function loadSession(): Promise<Session | null> {
  const result = await readJson(STORAGE_KEYS.session, isSession);
  if (result.status === 'ok') return result.value;
  if (result.status === 'corrupt') await removeKey(STORAGE_KEYS.session);
  return null;
}

/** Writes only the user id and last activity time (FR-029). */
export async function saveSession(session: Session): Promise<void> {
  await writeJson(STORAGE_KEYS.session, { userId: session.userId, lastActivityAt: session.lastActivityAt });
}

export async function clearSession(): Promise<void> {
  await removeKey(STORAGE_KEYS.session);
}
