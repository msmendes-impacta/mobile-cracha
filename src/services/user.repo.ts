import { normalizeUsername } from '../domain/username';
import { hasErrors, validateUser } from '../domain/validateUser';
import { isUserArray, toUserView, type FieldErrors, type User, type UserInput, type UserView } from '../models/user';
import type { CryptoPort } from './crypto.port';
import type { LoginAttemptsRepository } from './loginAttempts.repo';
import type { PasswordService } from './password.service';
import { readJson, STORAGE_KEYS, writeJson, type ReadResult } from './storage';

/** Stored user data could not be read; the app must fail closed (FR-031). */
export class CorruptDataError extends Error {
  constructor() {
    super('Stored user data is unreadable');
    this.name = 'CorruptDataError';
  }
}

/** First-user creation is only allowed while no user data has ever been stored (FR-001, FR-003). */
export class FirstUserNotAllowedError extends Error {
  constructor() {
    super('Users already exist');
    this.name = 'FirstUserNotAllowedError';
  }
}

/** The user being edited no longer exists. */
export class UserNotFoundError extends Error {
  constructor() {
    super('User not found');
    this.name = 'UserNotFoundError';
  }
}

/** The signed-in user tried to delete their own record (FR-018). */
export class SelfDeleteError extends Error {
  constructor() {
    super('Cannot delete the signed-in user');
    this.name = 'SelfDeleteError';
  }
}

export type SaveUserResult = { ok: true; user: UserView } | { ok: false; errors: FieldErrors };

export interface UserRepository {
  /** Raw read, including credentials. For services only, never for screens (FR-030). */
  loadUsers(): Promise<ReadResult<User[]>>;
  listUserViews(): Promise<UserView[]>;
  getById(id: string): Promise<UserView | undefined>;
  createFirstUser(input: UserInput): Promise<SaveUserResult>;
  createUser(input: UserInput): Promise<SaveUserResult>;
  /** Edit mode: a blank password keeps the current hash and salt (FR-012 to FR-016). */
  updateUser(id: string, input: UserInput): Promise<SaveUserResult>;
  /**
   * Hard delete together with the username's attempt record (FR-019). Never the signed-in
   * user (`SelfDeleteError`); a missing id is a no-op.
   */
  deleteUser(id: string, currentUserId: string): Promise<void>;
}

export function createUserRepository(
  crypto: CryptoPort,
  passwords: PasswordService,
  attempts: LoginAttemptsRepository,
  now: () => number = Date.now,
): UserRepository {
  const loadUsers = () => readJson(STORAGE_KEYS.users, isUserArray);

  async function requireUsers(): Promise<User[]> {
    const result = await loadUsers();
    if (result.status === 'corrupt') throw new CorruptDataError();
    return result.status === 'ok' ? result.value : [];
  }

  /** Re-validates against the users just read, so no path can store invalid or duplicate users (FR-016). */
  async function insert(input: UserInput, users: User[]): Promise<SaveUserResult> {
    const errors = validateUser(input, { kind: 'create' }, users);
    if (hasErrors(errors)) return { ok: false, errors };

    const { salt, passwordHash } = await passwords.createPasswordHash(input.password);
    const user: User = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      username: normalizeUsername(input.username),
      passwordHash,
      salt,
    };
    await writeJson(STORAGE_KEYS.users, [...users, user]);
    return { ok: true, user: toUserView(user) };
  }

  return {
    loadUsers,
    async listUserViews() {
      return (await requireUsers()).map(toUserView);
    },
    async getById(id) {
      const user = (await requireUsers()).find((u) => u.id === id);
      return user ? toUserView(user) : undefined;
    },
    async createFirstUser(input) {
      const result = await loadUsers();
      if (result.status === 'corrupt') throw new CorruptDataError();
      if (result.status === 'ok') throw new FirstUserNotAllowedError();
      return insert(input, []);
    },
    async createUser(input) {
      return insert(input, await requireUsers());
    },
    async updateUser(id, input) {
      const users = await requireUsers();
      const current = users.find((u) => u.id === id);
      if (!current) throw new UserNotFoundError();

      // Re-validated against fresh data, like create (FR-016).
      const errors = validateUser(input, { kind: 'edit', id }, users);
      if (hasErrors(errors)) return { ok: false, errors };

      // A new password always gets a new salt; a blank one keeps both (FR-012).
      const credentials =
        input.password.length > 0
          ? await passwords.createPasswordHash(input.password)
          : { salt: current.salt, passwordHash: current.passwordHash };
      const updated: User = {
        id: current.id,
        name: input.name.trim(),
        username: normalizeUsername(input.username),
        ...credentials,
      };
      await writeJson(
        STORAGE_KEYS.users,
        users.map((u) => (u.id === id ? updated : u)),
      );
      return { ok: true, user: toUserView(updated) };
    },
    async deleteUser(id, currentUserId) {
      if (id === currentUserId) throw new SelfDeleteError();
      const users = await requireUsers();
      const target = users.find((u) => u.id === id);
      if (!target) return;

      await writeJson(
        STORAGE_KEYS.users,
        users.filter((u) => u.id !== id),
      );
      await attempts.remove(target.username, now());
    },
  };
}
