import { lockRemainingSeconds, registerFailure } from '../domain/lockout';
import { normalizeUsername } from '../domain/username';
import type { LoginAttemptsRepository } from './loginAttempts.repo';
import type { PasswordService } from './password.service';
import { CorruptDataError, type UserRepository } from './user.repo';

/** Used when the login does not exist, so both failure paths do the same work (FR-005). */
const DUMMY_SALT = '0'.repeat(32);
const DUMMY_HASH = '0'.repeat(64);

export type SignInResult =
  | { status: 'ok'; userId: string }
  | { status: 'invalid' }
  | { status: 'locked'; seconds: number };

export interface AuthService {
  signIn(rawUsername: string, password: string, now: number): Promise<SignInResult>;
}

export function createAuthService(deps: {
  users: UserRepository;
  passwords: PasswordService;
  attempts: LoginAttemptsRepository;
}): AuthService {
  const { users, passwords, attempts } = deps;

  return {
    async signIn(rawUsername, password, now) {
      const username = normalizeUsername(rawUsername);

      // Locked: refuse before touching the password, and leave the record unchanged.
      const record = (await attempts.load())[username];
      const lockedFor = lockRemainingSeconds(record, now);
      if (lockedFor > 0) return { status: 'locked', seconds: lockedFor };

      const stored = await users.loadUsers();
      if (stored.status === 'corrupt') throw new CorruptDataError();
      const user = stored.status === 'ok' ? stored.value.find((u) => u.username === username) : undefined;

      // Always exactly one hash, known login or not (FR-005, FR-007).
      const matches = await passwords.verifyPassword(
        password,
        user?.salt ?? DUMMY_SALT,
        user?.passwordHash ?? DUMMY_HASH,
      );

      if (user && matches) {
        await attempts.remove(username, now);
        return { status: 'ok', userId: user.id };
      }

      const next = registerFailure(record, now);
      await attempts.save(username, next, now);
      const seconds = lockRemainingSeconds(next, now);
      return seconds > 0 ? { status: 'locked', seconds } : { status: 'invalid' };
    },
  };
}
