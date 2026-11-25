import AsyncStorage from '@react-native-async-storage/async-storage';

import { isUserArray } from '../../src/models/user';
import { isSession } from '../../src/models/session';
import { isAttemptMap } from '../../src/models/loginAttempt';
import { STORAGE_KEYS, readJson, removeKey, resetAll, writeJson } from '../../src/services/storage';

const validUser = { id: 'u1', name: 'Ana Lima', username: 'ana', passwordHash: 'h', salt: 's' };

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

describe('readJson', () => {
  it('returns absent when the key was never written', async () => {
    await expect(readJson(STORAGE_KEYS.users, isUserArray)).resolves.toEqual({ status: 'absent' });
  });

  it('returns ok with the parsed value when JSON is valid and passes the guard', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.users, JSON.stringify([validUser]));
    await expect(readJson(STORAGE_KEYS.users, isUserArray)).resolves.toEqual({
      status: 'ok',
      value: [validUser],
    });
  });

  it('returns ok for an empty array (users existed and were all removed is still a written key)', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.users, '[]');
    await expect(readJson(STORAGE_KEYS.users, isUserArray)).resolves.toEqual({ status: 'ok', value: [] });
  });

  it('returns corrupt for malformed JSON (fail closed, never absent)', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.users, '{');
    await expect(readJson(STORAGE_KEYS.users, isUserArray)).resolves.toEqual({ status: 'corrupt' });
  });

  it('returns corrupt when valid JSON fails the shape guard', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.users, JSON.stringify([{ id: 1 }]));
    await expect(readJson(STORAGE_KEYS.users, isUserArray)).resolves.toEqual({ status: 'corrupt' });
  });

  it('returns corrupt when the storage read itself throws', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk'));
    await expect(readJson(STORAGE_KEYS.users, isUserArray)).resolves.toEqual({ status: 'corrupt' });
  });

  it('validates sessions and attempt maps with their guards', async () => {
    await writeJson(STORAGE_KEYS.session, { userId: 'u1', lastActivityAt: 10 });
    await writeJson(STORAGE_KEYS.attempts, { ana: { failures: 1, lockouts: 0, lockedUntil: null } });
    await expect(readJson(STORAGE_KEYS.session, isSession)).resolves.toMatchObject({ status: 'ok' });
    await expect(readJson(STORAGE_KEYS.attempts, isAttemptMap)).resolves.toMatchObject({ status: 'ok' });

    await writeJson(STORAGE_KEYS.session, { userId: '', lastActivityAt: 10 });
    await writeJson(STORAGE_KEYS.attempts, { ana: { failures: -1, lockouts: 0, lockedUntil: null } });
    await expect(readJson(STORAGE_KEYS.session, isSession)).resolves.toEqual({ status: 'corrupt' });
    await expect(readJson(STORAGE_KEYS.attempts, isAttemptMap)).resolves.toEqual({ status: 'corrupt' });
  });
});

describe('writeJson / removeKey / resetAll', () => {
  it('writeJson replaces the whole value of a key', async () => {
    await writeJson(STORAGE_KEYS.users, [validUser]);
    await writeJson(STORAGE_KEYS.users, []);
    await expect(AsyncStorage.getItem(STORAGE_KEYS.users)).resolves.toBe('[]');
  });

  it('removeKey deletes a single key', async () => {
    await writeJson(STORAGE_KEYS.session, { userId: 'u1', lastActivityAt: 1 });
    await removeKey(STORAGE_KEYS.session);
    await expect(AsyncStorage.getItem(STORAGE_KEYS.session)).resolves.toBeNull();
  });

  it('resetAll removes exactly the three app keys and nothing else', async () => {
    await writeJson(STORAGE_KEYS.users, [validUser]);
    await writeJson(STORAGE_KEYS.session, { userId: 'u1', lastActivityAt: 1 });
    await writeJson(STORAGE_KEYS.attempts, {});
    await AsyncStorage.setItem('unrelated', 'keep');

    await resetAll();

    await expect(AsyncStorage.getAllKeys()).resolves.toEqual(['unrelated']);
    expect(Object.values(STORAGE_KEYS).sort()).toEqual(
      ['auth@attempts@v1', 'session@current', 'users@v1'].sort(),
    );
  });
});
