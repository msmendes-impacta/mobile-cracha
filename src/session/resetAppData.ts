import type { User } from '../models/user';
import type { ReadResult } from '../services/storage';
import { resolveBootStatus, type BootStatus } from './bootStatus';

export interface ResetDeps {
  resetAll(): Promise<void>;
  loadUsers(): Promise<ReadResult<User[]>>;
}

/**
 * "Apagar dados e recomeçar" (FR-031): erases every app key, then re-reads the users instead
 * of assuming success. Only a truly empty store opens first access; anything else stays
 * closed. A failed erase rejects, so the caller keeps the data error screen.
 */
export async function resetAppData({ resetAll, loadUsers }: ResetDeps): Promise<BootStatus> {
  await resetAll();
  return resolveBootStatus(await loadUsers(), null);
}
