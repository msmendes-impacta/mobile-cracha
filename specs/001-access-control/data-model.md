# Data Model: Access Control App (Crachá)

All data lives on the device in AsyncStorage. Keys are listed in [contracts/storage.md](contracts/storage.md).

## User (`src/models/user.ts`)

| Field | Type | Rules |
|---|---|---|
| `id` | `string` | UUID v4 (`Crypto.randomUUID()`), immutable, unique |
| `name` | `string` | trimmed, 2–80 chars |
| `username` | `string` | `normalizeUsername()` = trim + lowercase; 3–30 chars; `^[a-z0-9._-]+$`; unique across users |
| `passwordHash` | `string` | hex SHA-256 of `salt + password` |
| `salt` | `string` | 16 random bytes, hex (32 chars); regenerated on every password change |

Derived values, never stored: `firstName(name)` and `initials(name)`, which takes the first letter of the first and last tokens in uppercase.

**Input types**
- `UserInput` = `{ name: string; username: string; password: string; confirmPassword: string }` holds raw form values.
- `UserFormMode` = `{ kind: 'create' } | { kind: 'edit'; id: string }`.

**Validation** (`validateUser(input, mode, existingUsers) → FieldErrors`). It is a pure function, also called by `user.repo.save`.

| Field | Error code | pt-BR message |
|---|---|---|
| name | `nameLength` | "Informe o nome (mínimo 2 caracteres)." |
| username | `usernameFormat` | "Login deve ter 3 a 30 caracteres: letras, números, ponto, _ ou -." |
| username | `usernameTaken` | "Este login já está em uso." (ignores the record being edited) |
| password | `passwordRequired` | "Informe a senha." (create only) |
| password | `passwordLength` | "A senha deve ter entre 6 e 128 caracteres." |
| confirmPassword | `passwordMismatch` | "As senhas não conferem." (whenever password or confirmation is non-empty) |

**Lifecycle:** created → updated (any field; the password only when a new one is provided) → deleted. Deletion is a hard delete and is never allowed for the signed-in user.

## Session (`src/models/session.ts`)

| Field | Type | Rules |
|---|---|---|
| `userId` | `string` | must reference an existing User; otherwise the session ends |
| `lastActivityAt` | `number` | epoch ms |

**States** (computed by `sessionPolicy`, with `idle = now − lastActivityAt`):

```
active ──idle ≥ timeout − warning──▶ warning ──idle ≥ timeout──▶ expired
   ▲                                    │
   └──────── activity / "Continuar" ◀───┘
any state ── "Sair" or user deleted ──▶ (none)
idle < 0 (clock moved back) ──▶ expired
```

At most one session exists at a time.

## LoginAttemptRecord (`src/models/loginAttempt.ts`)

The records are stored as a map `Record<normalizedUsername, LoginAttemptRecord>`.

| Field | Type | Rules |
|---|---|---|
| `failures` | `number` | consecutive failures since the last lockout or success (0–4 at rest) |
| `lockouts` | `number` | lockouts applied so far (drives the doubling) |
| `lockedUntil` | `number \| null` | epoch ms; locked while `now < lockedUntil` |

**Transitions** (`src/domain/lockout.ts`):
- **failure:** `failures + 1`. When the count reaches 5, `lockouts + 1`, `lockedUntil = now + min(30 000 × 2^(lockouts−1), 300 000)`, and `failures = 0`.
- **success:** the record is deleted.
- **attempt while locked:** rejected without verifying the password or changing the record. The result reports the remaining seconds, rounded up.
- **pruning on write:** entries with `failures = 0` and `lockedUntil ≤ now` are dropped. Their `lockouts` history is dropped too, which is acceptable because the doubling only matters within an active attack window.

## Storage read result (`src/services/storage.ts`)

`ReadResult<T> = { status: 'absent' } | { status: 'ok'; value: T } | { status: 'corrupt' }`. A shape guard per key validates parsed JSON. Any mismatch is `corrupt`.
