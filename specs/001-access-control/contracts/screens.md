# Contract: Screens and navigation

The visual and state detail lives in [design-shape.md](../design-shape.md). This file fixes routes, params, and which session status shows which screens.

| Session status | Mounted stack | Screens |
|---|---|---|
| `loading` | none | `StartupScreen` (no navigator) |
| `dataError` | none | `DataErrorPage` (typed `APAGAR` reset) |
| `signedOut` | `PublicStack` | `login` → `LoginPage`; `firstUser` → `UserFormPage` in create mode, **mounted only when users are absent** |
| `signedIn` | `PrivateStack` | `users` → `UserListPage`; `userForm` → `UserFormPage` |

Route params (ids only, FR-030):
- `userForm`: `{ id?: string }`. Absent means create; present means edit.
- No other screen takes params.

Global overlays while `signedIn`:
- `SessionWarningDialog`, shown when `warningSecondsLeft` is defined.

Header (list screen):
- Title "Usuários".
- Right-side actions "Adicionar usuário" (account-plus) and "Sair" (logout), each with an accessibility label and a 48 dp target.
