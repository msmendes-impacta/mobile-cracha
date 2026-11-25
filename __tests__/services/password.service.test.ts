import { createPasswordService, SALT_BYTES } from '../../src/services/password.service';
import { createNodeCryptoAdapter } from '../helpers/nodeCrypto.adapter';

const passwords = createPasswordService(createNodeCryptoAdapter());

describe('password service', () => {
  it('creates a 32-hex-char salt and a 64-hex-char SHA-256 hash, never the password itself', async () => {
    const { salt, passwordHash } = await passwords.createPasswordHash('senha123');
    expect(SALT_BYTES).toBe(16);
    expect(salt).toMatch(/^[0-9a-f]{32}$/);
    expect(passwordHash).toMatch(/^[0-9a-f]{64}$/);
    expect(passwordHash).not.toContain('senha123');
  });

  it('uses a new salt each time, so the same password yields different hashes', async () => {
    const first = await passwords.createPasswordHash('senha123');
    const second = await passwords.createPasswordHash('senha123');
    expect(first.salt).not.toBe(second.salt);
    expect(first.passwordHash).not.toBe(second.passwordHash);
  });

  it('verifies the correct password and rejects a wrong one', async () => {
    const { salt, passwordHash } = await passwords.createPasswordHash('senha123');
    await expect(passwords.verifyPassword('senha123', salt, passwordHash)).resolves.toBe(true);
    await expect(passwords.verifyPassword('senha124', salt, passwordHash)).resolves.toBe(false);
  });

  it('treats leading and trailing spaces as part of the password', async () => {
    const { salt, passwordHash } = await passwords.createPasswordHash(' senha123 ');
    await expect(passwords.verifyPassword('senha123', salt, passwordHash)).resolves.toBe(false);
    await expect(passwords.verifyPassword(' senha123 ', salt, passwordHash)).resolves.toBe(true);
  });

  it('hashes salt + password, so the same password under a different salt does not verify', async () => {
    const a = await passwords.createPasswordHash('senha123');
    const b = await passwords.createPasswordHash('senha123');
    await expect(passwords.verifyPassword('senha123', b.salt, a.passwordHash)).resolves.toBe(false);
  });

  it('hashWithSalt is deterministic for a given salt and password', async () => {
    const h1 = await passwords.hashWithSalt('senha123', 'abc');
    const h2 = await passwords.hashWithSalt('senha123', 'abc');
    expect(h1).toBe(h2);
  });
});
