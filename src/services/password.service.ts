import { safeEqual } from '../domain/safeEqual';
import type { CryptoPort } from './crypto.port';

export const SALT_BYTES = 16;

export interface PasswordService {
  /** New random salt plus `SHA-256(salt + password)`. Call on create and on every password change. */
  createPasswordHash(password: string): Promise<{ salt: string; passwordHash: string }>;
  verifyPassword(password: string, salt: string, passwordHash: string): Promise<boolean>;
  hashWithSalt(password: string, salt: string): Promise<string>;
}

/** Passwords are never trimmed: spaces are part of the password (spec Edge Cases). */
export function createPasswordService(crypto: CryptoPort): PasswordService {
  const hashWithSalt = (password: string, salt: string) => crypto.sha256Hex(salt + password);

  return {
    hashWithSalt,
    async createPasswordHash(password) {
      const salt = await crypto.randomHex(SALT_BYTES);
      return { salt, passwordHash: await hashWithSalt(password, salt) };
    },
    async verifyPassword(password, salt, passwordHash) {
      return safeEqual(await hashWithSalt(password, salt), passwordHash);
    },
  };
}
