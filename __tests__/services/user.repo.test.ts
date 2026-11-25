import AsyncStorage from '@react-native-async-storage/async-storage';

import { MESSAGES } from '../../src/domain/validateUser';
import { createPasswordService } from '../../src/services/password.service';
import { STORAGE_KEYS } from '../../src/services/storage';
import {
  CorruptDataError,
  createUserRepository,
  FirstUserNotAllowedError,
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
