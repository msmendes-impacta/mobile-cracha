# Quickstart & Validation: Crachá

## Prerequisites
- Node.js LTS and npm.
- The **Expo Go** app on an Android phone, or an Android emulator (Android Studio).

## Run
```bash
npm install
npx expo start          # press "a" for the emulator, or scan the QR code with Expo Go
```

## Automated checks
```bash
npm test                # jest --coverage; fails below 90% on src/domain, src/services, src/session
npm run lint            # eslint; no-console is an error in src/
npx tsc --noEmit        # strict type check
npm audit --omit=dev    # expect no high/critical
```

## Manual validation (development build: 30 s session, 10 s warning)

| # | Scenario | Expected |
|---|---|---|
| 1 | Fresh install, open the app | Login badge with "Criar primeiro usuário" |
| 2 | Create the first user "Matheus Mendes" / `Matheus` / `senha123` | Signed in; the list greets "Olá, Matheus", "1 usuário cadastrado", entry marked "você" |
| 3 | Add "Nicoli Ferreira" / `nicoli.f`; try a second user with login ` MATHEUS ` | Nicoli saved; the duplicate shows "Este login já está em uso." |
| 4 | Edit Nicoli, leave the password blank, save; then sign in as her | Her old password still works |
| 5 | Open your own record | No "Excluir" |
| 6 | Delete Nicoli (confirm) | Removed; snackbar "Usuário excluído" |
| 7 | Sign out; enter a wrong password 5 times | 6th attempt shows "Muitas tentativas. Tente novamente em 30 segundos." Same behavior for an unknown login |
| 8 | Sign in and stay idle | Warning appears at about 20 s; "Continuar conectado" restarts it; ignoring it shows the login with the expiry notice |
| 9 | Edit a field, press system Back | "Descartar alterações?" |
| 10 | After logout, press system Back | The app closes or stays on login; no protected screen |
| 11 | TalkBack on, font size at maximum, both themes | Every control is announced; nothing is clipped; both themes are legible |

Corrupted data check: covered by automated tests (`storage` and `user.repo` return `corrupt` for `users@v1 = "{"`, and the first-user option is not offered). The Data Error screen itself is verified visually during development by temporarily forcing the `dataError` status. No debug menu ships.

Data at rest check: `adb backup` excludes the app (`allowBackup=false`). No password appears in plain text in stored values (verified by the `user.repo` tests).
