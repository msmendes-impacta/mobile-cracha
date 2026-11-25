import { createAuthService } from './auth.service';
import type { CryptoPort } from './crypto.port';
import { createLoginAttemptsRepository } from './loginAttempts.repo';
import { createPasswordService } from './password.service';
import { createUserRepository } from './user.repo';

/** Wires the services together. The app passes the expo-crypto adapter; tests pass node:crypto. */
export function createAppServices(crypto: CryptoPort) {
  const passwords = createPasswordService(crypto);
  const users = createUserRepository(crypto, passwords);
  const attempts = createLoginAttemptsRepository();
  const auth = createAuthService({ users, passwords, attempts });
  return { passwords, users, attempts, auth };
}

export type AppServices = ReturnType<typeof createAppServices>;
