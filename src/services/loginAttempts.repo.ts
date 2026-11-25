import { pruneAttempts } from '../domain/lockout';
import { isAttemptMap, type LoginAttemptMap, type LoginAttemptRecord } from '../models/loginAttempt';
import { readJson, STORAGE_KEYS, writeJson } from './storage';

export interface LoginAttemptsRepository {
  /** Corrupt or absent data reads as no failures (contracts/storage.md: the hash still guards access). */
  load(): Promise<LoginAttemptMap>;
  save(username: string, record: LoginAttemptRecord, now: number): Promise<void>;
  remove(username: string, now: number): Promise<void>;
}

export function createLoginAttemptsRepository(): LoginAttemptsRepository {
  async function load(): Promise<LoginAttemptMap> {
    const result = await readJson(STORAGE_KEYS.attempts, isAttemptMap);
    return result.status === 'ok' ? result.value : {};
  }

  return {
    load,
    async save(username, record, now) {
      const map = await load();
      map[username] = record;
      await writeJson(STORAGE_KEYS.attempts, pruneAttempts(map, now));
    },
    async remove(username, now) {
      const map = await load();
      delete map[username];
      await writeJson(STORAGE_KEYS.attempts, pruneAttempts(map, now));
    },
  };
}
