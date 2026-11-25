import AsyncStorage from '@react-native-async-storage/async-storage';

import { createAppServices } from '../../src/services/container';
import { STORAGE_KEYS } from '../../src/services/storage';
import { CorruptDataError } from '../../src/services/user.repo';
import { createNodeCryptoAdapter } from '../helpers/nodeCrypto.adapter';

const T0 = 1_700_000_000_000;

function setup() {
  const crypto = createNodeCryptoAdapter();
  const hashSpy = jest.spyOn(crypto, 'sha256Hex');
  const services = createAppServices(crypto);
  return { ...services, hashSpy };
}

async function seed() {
  const s = setup();
  const created = await s.users.createFirstUser({
    name: 'Matheus Mendes',
    username: 'matheus',
    password: 'senha123',
    confirmPassword: 'senha123',
  });
  if (!created.ok) throw new Error('seed failed');
  s.hashSpy.mockClear();
  return { ...s, userId: created.user.id };
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('signIn', () => {
  it('signs in with correct credentials, any case/spacing of the login, and clears failures', async () => {
    const s = await seed();
    await s.auth.signIn('matheus', 'errada', T0);
    await expect(s.auth.signIn('  MATHEUS ', 'senha123', T0)).resolves.toEqual({ status: 'ok', userId: s.userId });
    await expect(s.attempts.load()).resolves.toEqual({});
  });

  it('returns invalid for a wrong password', async () => {
    const s = await seed();
    await expect(s.auth.signIn('matheus', 'senha124', T0)).resolves.toEqual({ status: 'invalid' });
  });

  it('returns the same result for an unknown login and still computes exactly one hash (FR-005)', async () => {
    const s = await seed();
    await expect(s.auth.signIn('ninguem', 'senha123', T0)).resolves.toEqual({ status: 'invalid' });
    expect(s.hashSpy).toHaveBeenCalledTimes(1);
    s.hashSpy.mockClear();
    await s.auth.signIn('matheus', 'senha124', T0);
    expect(s.hashSpy).toHaveBeenCalledTimes(1);
  });

  it('works on a fresh device with no users (everything is invalid)', async () => {
    const s = setup();
    await expect(s.auth.signIn('qualquer', 'senha123', T0)).resolves.toEqual({ status: 'invalid' });
  });

  it('locks after 5 failures, without verifying the password while locked', async () => {
    const s = await seed();
    for (let i = 0; i < 4; i += 1) {
      await expect(s.auth.signIn('matheus', 'errada', T0)).resolves.toEqual({ status: 'invalid' });
    }
    await expect(s.auth.signIn('matheus', 'errada', T0)).resolves.toEqual({ status: 'locked', seconds: 30 });

    s.hashSpy.mockClear();
    const before = await s.attempts.load();
    await expect(s.auth.signIn('matheus', 'senha123', T0 + 10_000)).resolves.toEqual({
      status: 'locked',
      seconds: 20,
    });
    expect(s.hashSpy).not.toHaveBeenCalled();
    await expect(s.attempts.load()).resolves.toEqual(before);

    await expect(s.auth.signIn('matheus', 'senha123', T0 + 30_000)).resolves.toEqual({
      status: 'ok',
      userId: s.userId,
    });
  });

  it('locks unknown logins exactly like existing ones (FR-007)', async () => {
    const s = await seed();
    let last;
    for (let i = 0; i < 5; i += 1) last = await s.auth.signIn('ninguem', 'x', T0);
    expect(last).toEqual({ status: 'locked', seconds: 30 });
    await expect(s.auth.signIn('ninguem', 'x', T0 + 1)).resolves.toEqual({ status: 'locked', seconds: 30 });
  });

  it('resets corrupt attempt data instead of failing', async () => {
    const s = await seed();
    await AsyncStorage.setItem(STORAGE_KEYS.attempts, '{bad');
    await expect(s.auth.signIn('matheus', 'errada', T0)).resolves.toEqual({ status: 'invalid' });
    await expect(s.attempts.load()).resolves.toEqual({
      matheus: { failures: 1, lockouts: 0, lockedUntil: null },
    });
  });

  it('propagates corrupt user data as CorruptDataError', async () => {
    const s = setup();
    await AsyncStorage.setItem(STORAGE_KEYS.users, '{');
    await expect(s.auth.signIn('matheus', 'senha123', T0)).rejects.toBeInstanceOf(CorruptDataError);
  });
});

describe('login attempts repository', () => {
  it('removes a single record and prunes idle ones on write', async () => {
    const s = setup();
    await s.attempts.save('a', { failures: 1, lockouts: 0, lockedUntil: null }, T0);
    await s.attempts.save('b', { failures: 0, lockouts: 1, lockedUntil: T0 + 5 }, T0);
    await s.attempts.remove('a', T0 + 10);
    await expect(s.attempts.load()).resolves.toEqual({});
  });
});
