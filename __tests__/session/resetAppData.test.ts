import AsyncStorage from '@react-native-async-storage/async-storage';

import { resetAll, STORAGE_KEYS } from '../../src/services/storage';
import { createUserRepository } from '../../src/services/user.repo';
import { createLoginAttemptsRepository } from '../../src/services/loginAttempts.repo';
import { createPasswordService } from '../../src/services/password.service';
import { resetAppData } from '../../src/session/resetAppData';
import { createNodeCryptoAdapter } from '../helpers/nodeCrypto.adapter';

const crypto = createNodeCryptoAdapter();
const users = createUserRepository(crypto, createPasswordService(crypto), createLoginAttemptsRepository());

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('resetAppData (FR-031)', () => {
  it('erases every key and returns first access: signed out with no users', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.users, '{');
    await AsyncStorage.setItem(STORAGE_KEYS.session, '{"userId":"x","lastActivityAt":1}');
    await AsyncStorage.setItem(STORAGE_KEYS.attempts, '{"ana":{}}');

    await expect(resetAppData({ resetAll, loadUsers: users.loadUsers })).resolves.toEqual({
      status: 'signedOut',
      usersExist: false,
      clearSession: false,
    });
    expect(await AsyncStorage.multiGet(Object.values(STORAGE_KEYS))).toEqual(
      Object.values(STORAGE_KEYS).map((key) => [key, null]),
    );
  });

  it('stays on the data error when the users are still unreadable after the reset', async () => {
    const result = await resetAppData({
      resetAll: async () => undefined,
      loadUsers: async () => ({ status: 'corrupt' }),
    });
    expect(result.status).toBe('dataError');
  });

  it('stays closed when users somehow still exist after the reset', async () => {
    const result = await resetAppData({
      resetAll: async () => undefined,
      loadUsers: async () => ({ status: 'ok', value: [] }),
    });
    expect(result).toEqual({ status: 'signedOut', usersExist: true, clearSession: false });
  });

  it('propagates a failed erase so the caller keeps the error screen', async () => {
    const loadUsers = jest.fn();
    await expect(
      resetAppData({ resetAll: () => Promise.reject(new Error('disk')), loadUsers }),
    ).rejects.toThrow('disk');
    expect(loadUsers).not.toHaveBeenCalled();
  });
});
