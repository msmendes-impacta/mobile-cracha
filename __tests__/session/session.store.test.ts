import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearSession, loadSession, saveSession } from '../../src/session/session.store';
import { STORAGE_KEYS } from '../../src/services/storage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('session store', () => {
  it('returns null when no session was saved', async () => {
    await expect(loadSession()).resolves.toBeNull();
  });

  it('round-trips a saved session and clears it', async () => {
    const session = { userId: 'u1', lastActivityAt: 123 };
    await saveSession(session);
    await expect(loadSession()).resolves.toEqual(session);
    await clearSession();
    await expect(loadSession()).resolves.toBeNull();
  });

  it('stores only the user id and last activity time (FR-029)', async () => {
    await saveSession({ userId: 'u1', lastActivityAt: 5 });
    expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.session))!)).toEqual({
      userId: 'u1',
      lastActivityAt: 5,
    });
  });

  it('treats a corrupt session as signed out and removes the key', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.session, '{"userId":42}');
    await expect(loadSession()).resolves.toBeNull();
    await expect(AsyncStorage.getItem(STORAGE_KEYS.session)).resolves.toBeNull();
  });
});
