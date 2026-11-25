# Contract: Device storage (AsyncStorage)

| Key | Value (JSON) | Absent means | Corrupt means |
|---|---|---|---|
| `users@v1` | `User[]` | no user has ever been created → offer "Criar primeiro usuário" | route to the Data Error screen (fail closed); **never** treated as `[]` |
| `session@current` | `Session` | signed out | treated as signed out and the key is removed (the session is not a security boundary for data) |
| `auth@attempts@v1` | `Record<string, LoginAttemptRecord>` | no failures recorded | reset to `{}` and the key is rewritten. This fails toward "no lockout", which is acceptable because the hash check still guards access. |

Rules:
- Every write is a full replace of one key, done through a single repository per key. No other module touches AsyncStorage.
- Nothing else is stored. Passwords and hashes never go into the session or the attempts keys.
- `resetAll()` removes exactly these three keys (`multiRemove`). It runs only after the typed `APAGAR` confirmation.
- `app.json` sets `android.allowBackup: false`, so these keys never enter device backups.
