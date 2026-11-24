# Contract: Internal modules (what screens may call)

Screens and contexts call **only** these functions. All of them are async unless marked pure. Types are in [data-model.md](../data-model.md).

## `src/domain` (pure, no React, no storage)

```ts
normalizeUsername(raw: string): string
validateUser(input: UserInput, mode: UserFormMode, existing: User[]): FieldErrors   // {} when valid
hasErrors(errors: FieldErrors): boolean
registerFailure(rec: LoginAttemptRecord | undefined, now: number): LoginAttemptRecord
lockRemainingSeconds(rec: LoginAttemptRecord | undefined, now: number): number     // 0 = not locked
safeEqual(a: string, b: string): boolean
sortUsersByName(users: User[]): User[]
firstName(name: string): string
initials(name: string): string
userCountLabel(n: number): string                                                   // "1 usuário cadastrado" / "N usuários cadastrados"
isFormDirty(initial: UserInput, current: UserInput): boolean
```

## `src/services`

```ts
// storage.ts
readJson<T>(key: string, guard: (v: unknown) => v is T): Promise<ReadResult<T>>
writeJson(key: string, value: unknown): Promise<void>
resetAll(): Promise<void>

// password.service.ts  (CryptoPort injected; app uses expo-crypto, tests use node:crypto)
createPasswordHash(password: string): Promise<{ salt: string; passwordHash: string }>
verifyPassword(password: string, salt: string, passwordHash: string): Promise<boolean>

// user.repo.ts
loadUsers(): Promise<ReadResult<User[]>>
getById(id: string): Promise<User | undefined>                  // throws CorruptDataError on corrupt
saveUser(input: UserInput, mode: UserFormMode): Promise<{ ok: true; user: User } | { ok: false; errors: FieldErrors }>
deleteUser(id: string, currentUserId: string): Promise<void>    // throws SelfDeleteError when id === currentUserId; also removes the username's attempt record
// Screens receive users as UserView = { id, name, username } — passwordHash/salt never leave services (FR-030)

// auth.service.ts
signIn(rawUsername: string, password: string, now: number):
  Promise<{ status: 'ok'; userId: string } | { status: 'invalid' } | { status: 'locked'; seconds: number }>
```

Guarantees:
- `saveUser` re-runs `validateUser` with fresh storage data. A UI bypass cannot store invalid or duplicate users (FR-016).
- `signIn` checks the lock first. It always computes one hash, using a dummy salt when the username is unknown, so the invalid and unknown paths are indistinguishable (FR-005, FR-007).
- No function logs anything (`no-console`).

## `src/session`

```ts
// bootStatus.ts (pure)
resolveBootStatus(users: ReadResult<User[]>, session: Session | null):
  { status: 'dataError' | 'signedOut' | 'signedIn'; usersExist: boolean; userId?: string; clearSession: boolean }

// sessionPolicy.ts (pure)
SESSION_IDLE_TIMEOUT_MS   // 300_000 | 30_000 in __DEV__
SESSION_WARNING_MS        // 60_000 | 10_000 in __DEV__
evaluateSession(lastActivityAt: number, now: number): { state: 'active' } | { state: 'warning'; secondsLeft: number } | { state: 'expired' }

// session.store.ts
loadSession(): Promise<Session | null>
saveSession(s: Session): Promise<void>
clearSession(): Promise<void>

// SessionController.ts  (no React; clock + timers injected)
class SessionController {
  start(userId: string): Promise<void>
  restore(): Promise<Session | null>          // null when absent, expired, or user missing
  recordActivity(): void                      // in memory; persisted at most every 15 s
  flush(): Promise<void>                      // persist now (AppState → background)
  check(): SessionCheck                       // delegates to evaluateSession
  end(reason: 'logout' | 'expired' | 'userDeleted'): Promise<void>
  onChange(listener: (s: SessionCheck & { reason?: string }) => void): () => void
}
```

## `src/contexts/SessionContext.tsx` (React adapter, manually verified)

It exposes `useSession()` → `{ status: 'loading' | 'dataError' | 'signedOut' | 'signedIn'; userId?; warningSecondsLeft?; expiredNotice: boolean; signIn(); signOut(); keepAlive(); resetAllData() }`.
