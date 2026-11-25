import AsyncStorage from '@react-native-async-storage/async-storage';

import { MESSAGES } from '../../src/domain/validateUser';
import { createPasswordService } from '../../src/services/password.service';
import { STORAGE_KEYS } from '../../src/services/storage';
import {
  CorruptDataError,
  createUserRepository,
  FirstUserNotAllowedError,
  UserNotFoundError,
} from '../../src/services/user.repo';
import { createNodeCryptoAdapter } from '../helpers/nodeCrypto.adapter';

const crypto = createNodeCryptoAdapter();
const passwords = createPasswordService(crypto);
const repo = createUserRepository(crypto, passwords);

const matheus = { name: ' Matheus Mendes ', username: ' Matheus ', password: 'senha123', confirmPassword: 'senha123' };
const nicoli = { name: 'Nicoli Ferreira', username: 'nicoli.f', password: 'outra123', confirmPassword: 'outra123' };

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('loadUsers / listUserViews / getById', () => {
  it('reports absent on a fresh device and lists nothing', async () => {
    await expect(repo.loadUsers()).resolves.toEqual({ status: 'absent' });
    await expect(repo.listUserViews()).resolves.toEqual([]);
  });

  it('reports corrupt for unreadable data and refuses to list (fail closed)', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.users, '{');
    await expect(repo.loadUsers()).resolves.toEqual({ status: 'corrupt' });
    await expect(repo.listUserViews()).rejects.toBeInstanceOf(CorruptDataError);
    await expect(repo.getById('x')).rejects.toBeInstanceOf(CorruptDataError);
  });

  it('returns views without hash or salt', async () => {
    const created = await repo.createFirstUser(matheus);
    if (!created.ok) throw new Error('expected ok');
    const views = await repo.listUserViews();
    expect(views).toEqual([{ id: created.user.id, name: 'Matheus Mendes', username: 'matheus' }]);
    expect(Object.keys(views[0]!)).toEqual(['id', 'name', 'username']);
    await expect(repo.getById(created.user.id)).resolves.toEqual(views[0]);
    await expect(repo.getById('missing')).resolves.toBeUndefined();
  });
});

describe('createFirstUser', () => {
  it('stores a UUID, trimmed name, normalized username, hash and salt, and never the plain password', async () => {
    const result = await repo.createFirstUser(matheus);
    expect(result.ok).toBe(true);

    const raw = (await AsyncStorage.getItem(STORAGE_KEYS.users))!;
    expect(raw).not.toContain('senha123');
    const [stored] = JSON.parse(raw);
    expect(stored.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(stored.name).toBe('Matheus Mendes');
    expect(stored.username).toBe('matheus');
    expect(stored.salt).toMatch(/^[0-9a-f]{32}$/);
    await expect(passwords.verifyPassword('senha123', stored.salt, stored.passwordHash)).resolves.toBe(true);
  });

  it('is refused once any user exists (FR-003)', async () => {
    await repo.createFirstUser(matheus);
    await expect(repo.createFirstUser(nicoli)).rejects.toBeInstanceOf(FirstUserNotAllowedError);
  });

  it('is refused when stored data is corrupt (never treated as "no users")', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.users, 'not json');
    await expect(repo.createFirstUser(matheus)).rejects.toBeInstanceOf(CorruptDataError);
  });

  it('returns field errors for invalid input without writing anything', async () => {
    const result = await repo.createFirstUser({ ...matheus, name: 'A', confirmPassword: 'x' });
    expect(result).toEqual({
      ok: false,
      errors: { name: MESSAGES.nameLength, confirmPassword: MESSAGES.passwordMismatch },
    });
    await expect(AsyncStorage.getItem(STORAGE_KEYS.users)).resolves.toBeNull();
  });
});

describe('createUser', () => {
  it('adds a user next to the existing ones', async () => {
    await repo.createFirstUser(matheus);
    const result = await repo.createUser(nicoli);
    expect(result.ok).toBe(true);
    const views = await repo.listUserViews();
    expect(views.map((v) => v.username)).toEqual(['matheus', 'nicoli.f']);
  });

  it('re-validates uniqueness against fresh storage (defense in depth, FR-016)', async () => {
    await repo.createFirstUser(matheus);
    const result = await repo.createUser({ ...nicoli, username: ' MATHEUS ' });
    expect(result).toEqual({ ok: false, errors: { username: MESSAGES.usernameTaken } });
    await expect(repo.listUserViews()).resolves.toHaveLength(1);
  });

  it('refuses to write on top of corrupt data', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.users, '[{"id":1}]');
    await expect(repo.createUser(nicoli)).rejects.toBeInstanceOf(CorruptDataError);
  });
});

describe('updateUser (edit mode, FR-012 to FR-016)', () => {
  const storedUsers = async () => JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.users)) ?? '[]');

  async function seed() {
    const first = await repo.createFirstUser(matheus);
    const second = await repo.createUser(nicoli);
    if (!first.ok || !second.ok) throw new Error('seed failed');
    return { matheusId: first.user.id, nicoliId: second.user.id };
  }

  it('updates name and username and keeps the hash and salt when the password is blank', async () => {
    const { nicoliId } = await seed();
    const before = (await storedUsers()).find((u: { id: string }) => u.id === nicoliId);

    const result = await repo.updateUser(nicoliId, {
      name: ' Nicoli F. Souza ',
      username: ' NICOLI ',
      password: '',
      confirmPassword: '',
    });

    expect(result).toEqual({ ok: true, user: { id: nicoliId, name: 'Nicoli F. Souza', username: 'nicoli' } });
    const after = (await storedUsers()).find((u: { id: string }) => u.id === nicoliId);
    expect(after.passwordHash).toBe(before.passwordHash);
    expect(after.salt).toBe(before.salt);
  });

  it('regenerates the salt and hash when a new password is given, and the new one verifies', async () => {
    const { nicoliId } = await seed();
    const before = (await storedUsers()).find((u: { id: string }) => u.id === nicoliId);

    const result = await repo.updateUser(nicoliId, { ...nicoli, password: 'nova-senha', confirmPassword: 'nova-senha' });

    expect(result.ok).toBe(true);
    const after = (await storedUsers()).find((u: { id: string }) => u.id === nicoliId);
    expect(after.salt).not.toBe(before.salt);
    expect(after.passwordHash).not.toBe(before.passwordHash);
    await expect(passwords.verifyPassword('nova-senha', after.salt, after.passwordHash)).resolves.toBe(true);
    await expect(passwords.verifyPassword('outra123', after.salt, after.passwordHash)).resolves.toBe(false);
    expect(JSON.stringify(await storedUsers())).not.toContain('nova-senha');
  });

  it("allows keeping the user's own current username", async () => {
    const { matheusId } = await seed();
    const result = await repo.updateUser(matheusId, { ...matheus, password: '', confirmPassword: '' });
    expect(result.ok).toBe(true);
  });

  it("rejects another user's username in any case or spacing", async () => {
    const { nicoliId } = await seed();
    const result = await repo.updateUser(nicoliId, { ...nicoli, username: '  MaTheus ', password: '', confirmPassword: '' });
    expect(result).toEqual({ ok: false, errors: { username: MESSAGES.usernameTaken } });
    expect((await storedUsers()).find((u: { id: string }) => u.id === nicoliId).username).toBe('nicoli.f');
  });

  it('rejects invalid input without writing', async () => {
    const { nicoliId } = await seed();
    const before = await AsyncStorage.getItem(STORAGE_KEYS.users);
    const result = await repo.updateUser(nicoliId, { ...nicoli, name: 'N', password: '123', confirmPassword: '123' });
    expect(result).toEqual({ ok: false, errors: { name: MESSAGES.nameLength, password: MESSAGES.passwordLength } });
    expect(await AsyncStorage.getItem(STORAGE_KEYS.users)).toBe(before);
  });

  it('throws UserNotFoundError for a missing id', async () => {
    await seed();
    await expect(repo.updateUser('missing', { ...nicoli })).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it('never changes the id and keeps the other users and their order', async () => {
    const { matheusId, nicoliId } = await seed();
    await repo.updateUser(nicoliId, { ...nicoli, name: 'Outro Nome', password: '', confirmPassword: '' });
    expect((await storedUsers()).map((u: { id: string }) => u.id)).toEqual([matheusId, nicoliId]);
  });

  it('refuses to write on top of corrupt data', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.users, '{');
    await expect(repo.updateUser('any', nicoli)).rejects.toBeInstanceOf(CorruptDataError);
  });
});
