import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The only module that touches AsyncStorage (contracts/storage.md).
 * Keys are versioned so future migrations can be detected.
 */
export const STORAGE_KEYS = {
  users: 'users@v1',
  session: 'session@current',
  attempts: 'auth@attempts@v1',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * `absent` and `corrupt` are deliberately distinct: treating unreadable data as
 * "nothing stored" would reopen first-user signup (FR-031, fail closed).
 */
export type ReadResult<T> = { status: 'absent' } | { status: 'ok'; value: T } | { status: 'corrupt' };

export async function readJson<T>(
  key: StorageKey,
  guard: (value: unknown) => value is T,
): Promise<ReadResult<T>> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(key);
  } catch {
    // A failed read is not proof that nothing is stored: fail closed.
    return { status: 'corrupt' };
  }
  if (raw === null) return { status: 'absent' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: 'corrupt' };
  }
  return guard(parsed) ? { status: 'ok', value: parsed } : { status: 'corrupt' };
}

export async function writeJson(key: StorageKey, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeKey(key: StorageKey): Promise<void> {
  await AsyncStorage.removeItem(key);
}

/** Erases every app key. Only called after the typed "APAGAR" confirmation. */
export async function resetAll(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
}
