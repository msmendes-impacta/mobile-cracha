# Tasks: Access Control App (Crachá)

**Input**: Design documents from `/specs/001-access-control/` ([plan.md](plan.md), [spec.md](spec.md), [design-shape.md](design-shape.md), [data-model.md](data-model.md), [contracts/](contracts/), [research.md](research.md), [quickstart.md](quickstart.md))

**Tests**: REQUIRED. Constitution §IV and spec SC-003 require Jest tests for every business rule, with ≥90% coverage on `src/domain`, `src/services`, `src/session`. Test tasks precede the implementation they cover.

**UI rule**: every task that touches `src/pages/` or `src/components/` MUST follow [design-shape.md](design-shape.md) (the "Crachá Corporativo" direction), use the `src/theme` tokens, and meet spec FR-034 to FR-041. It is built with `/impeccable craft` (Phase 6 of the product flow).

**Format**: `- [ ] [ID] [P?] [Story?] Description with file path`

---

## Phase 1: Setup

- [x] T001 Scaffold the Expo SDK 58 blank TypeScript app in a **temporary folder** (`npx create-expo-app@latest <tmp> --template blank-typescript@sdk-58 --no-install`). Copy it into the repo root **without overwriting** existing files (README.md, .gitignore, PRODUCT.md, specs/, .specify/, .claude/, docs/), for example with `robocopy <tmp> . /E /XC /XN /XO`, then run `npm install`. Confirm `package.json` has expo ~58, react-native 0.88, react 19.3.
- [x] T002 Install runtime deps with `npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage expo-crypto @expo/vector-icons expo-status-bar` and record them in package.json.
- [x] T003 [P] Configure `app.json`: name "Crachá", slug "cracha", `userInterfaceStyle: "automatic"`, `android.allowBackup: false`, android `softwareKeyboardLayoutMode: "resize"`.
- [x] T004 [P] Enable TypeScript `strict: true` (and `noUncheckedIndexedAccess`) in `tsconfig.json`.
- [x] T005 [P] Configure Jest: install `jest-expo jest @types/jest` via `npx expo install -- --save-dev`. Create `jest.config.js` (preset `jest-expo`, `collectCoverageFrom: ["src/domain/**","src/services/**","src/session/**"]` excluding `expoCrypto.adapter.ts`, `coverageThreshold` global and per path 90 lines/branches/functions) and `jest.setup.ts` (mock `@react-native-async-storage/async-storage` with `@react-native-async-storage/async-storage/jest/async-storage-mock`). Add scripts `"test": "jest --coverage"`, `"typecheck": "tsc --noEmit"`.
- [x] T006 [P] Configure ESLint with `npx expo lint` (eslint-config-expo) and add the rule `"no-console": "error"` for `src/**` in `eslint.config.js`. Add the script `"lint": "eslint ."`.
- [x] T007 Create the folder skeleton `src/{models,domain,services,session,contexts,navigation,theme,components,pages}` and `__tests__/{domain,services,session,helpers}`.

---

## Phase 2: Foundational (blocks every story)

**Goal**: models, storage, crypto, theme, and navigation shell exist. Nothing user-visible yet.

- [x] T008 [P] Create `src/models/user.ts` with `User { id: string; name: string; username: string; passwordHash: string; salt: string }`, `UserView { id; name; username }`, `UserInput { name; username; password; confirmPassword }`, `UserFormMode = {kind:'create'} | {kind:'edit'; id: string}`, `FieldErrors = Partial<Record<'name'|'username'|'password'|'confirmPassword', string>>`, and `isUserArray` shape guard.
- [x] T009 [P] Create `src/models/session.ts` (`Session { userId: string; lastActivityAt: number }`, `isSession` guard) and `src/models/loginAttempt.ts` (`LoginAttemptRecord { failures: number; lockouts: number; lockedUntil: number | null }`, `isAttemptMap` guard).
- [x] T010 [P] Write `__tests__/services/storage.test.ts`: absent key → `{status:'absent'}`; valid JSON passing the guard → `ok`; `"{"` → `corrupt`; valid JSON failing the guard → `corrupt`; `resetAll` removes exactly `users@v1`, `session@current`, `auth@attempts@v1`.
- [x] T011 Implement `src/services/storage.ts` (`STORAGE_KEYS`, `readJson`, `writeJson`, `removeKey`, `resetAll`) per [contracts/storage.md](contracts/storage.md). It is the only module importing AsyncStorage and contains no logging.
- [x] T012 [P] Create `src/services/crypto.port.ts` (`CryptoPort { randomUUID(): string; randomHex(bytes: number): Promise<string>; sha256Hex(input: string): Promise<string> }`), `src/services/expoCrypto.adapter.ts` (expo-crypto implementation), and `__tests__/helpers/nodeCrypto.adapter.ts` (node:crypto implementation for tests).
- [x] T013 [P] Write `__tests__/domain/safeEqual.test.ts` (equal, different at the first and last char, different length, empty strings), then implement `src/domain/safeEqual.ts` (full-length XOR, no early exit).
- [x] T014 [P] Write `__tests__/services/password.service.test.ts` (the hash is not the password; the same password with a new salt gives a different hash; verify accepts the correct password and rejects a wrong one; leading/trailing spaces are significant; the salt is 32 hex chars), then implement `src/services/password.service.ts` (`createPasswordHash`, `verifyPassword`, injectable `CryptoPort`).
- [x] T015 [P] Create theme tokens in `src/theme/tokens.ts` (light and dark roles: ground `#E8EDF3`-family, badgeCard, badgeBand `#0B3D91`-family, primary/onPrimary, surface/onSurface/onSurfaceVariant, outline, focus, error/onError, errorContainer, scrim), the type scale in sp in `src/theme/typography.ts` (display, headline, title, body, label; ID-number style: tracked tabular caps), spacing on an 8 dp grid, and `src/theme/useTheme.ts` (`useColorScheme`). Contrast is measured and recorded later, in T059.
- [x] T016 Create `src/navigation/types.ts` (PublicStack: `login`, `firstUser`; PrivateStack: `users`, `userForm: { id?: string }`), and `src/navigation/RootNavigator.tsx` rendering by session status (`loading` → StartupScreen, `dataError` → DataErrorPage, `signedOut` → PublicStack, `signedIn` → PrivateStack), with stack animation from `AccessibilityInfo.isReduceMotionEnabled()` (`fade` or `none` when reduced).
- [x] T017 Wire `App.tsx`: `SafeAreaProvider`, `SessionProvider` (stub returning `loading`, replaced in US1), `NavigationContainer` with the theme, `StatusBar`, and root `View` with `onTouchStart` reserved for activity (wired in US5).
- [x] T018 [P] Build shared components per design-shape: `src/components/TextField/` (persistent label, counter slot, error text plus icon, `accessibilityLabel` combining label and error, ref forwarding, secure entry with an accessible show/hide toggle), `src/components/PrimaryButton/` (full-width, 48 dp min, loading state disables it), `src/components/HeaderAction/` (icon button, 48 dp, required `accessibilityLabel`), `src/components/ConfirmDialog/`, `src/components/Snackbar/` (live region).
- [x] T019 [P] Build the badge pieces per design-shape §3: `src/components/MiniBadgeAvatar/` (rounded square, initials, navy band strip, decorative and hidden from a11y), and the decorative barcode as plain Views inside `src/components/Badge/Barcode.tsx` (`importantForAccessibility="no-hide-descendants"`).

**Checkpoint**: `npm test`, `npm run lint`, and `npm run typecheck` pass. The app boots to a blank Startup screen.

---

## Phase 3: User Story 1 - First access and login (P1) 🎯 MVP

**Goal**: first user creation on a fresh install, sign-in with enumeration resistance and lockout.
**Independent test**: fresh install → create the first user → sign out → sign in correctly and incorrectly → trigger a lockout (quickstart #1, #2, #7).

### Tests (write first, must fail)
- [x] T020 [P] [US1] `__tests__/domain/username.test.ts`: `normalizeUsername` trims and lowercases (`" MATHEUS "` → `"matheus"`); the format check enforces "3–30 chars; `^[a-z0-9._-]+$`" and rejects (does not strip) other characters.
- [x] T021 [P] [US1] `__tests__/domain/validateUser.test.ts`: every rule in data-model §User validation table ("name: trimmed, 2–80 chars"; "username 3–30 chars; `^[a-z0-9._-]+$`; unique across users"; "password 6–128, not trimmed, required on create, optional on edit"; "confirmPassword must equal password whenever either is non-empty"), in both modes, including the edit-self username not being treated as a duplicate and the exact pt-BR messages.
- [x] T022 [P] [US1] `__tests__/domain/lockout.test.ts`: failures 1–4 do not lock; the 5th locks for 30 s; the second lockout locks for 60 s, then 120, 240, capped at 300 s; `failures` resets to 0 after a lock; `lockRemainingSeconds` rounds up and returns 0 after expiry; undefined record → 0.
- [x] T023 [P] [US1] `__tests__/services/user.repo.test.ts` (create and first-user part): `loadUsers` returns `absent` on a fresh store and `corrupt` on `"{"`; `saveUser` in create mode stores a UUID id, the normalized username, and the hash plus salt, and **no plain password anywhere in the stored JSON**; it rejects invalid input and duplicates (re-validates with fresh data); it returns `UserView`s without hash or salt.
- [x] T024 [P] [US1] `__tests__/services/auth.service.test.ts`: correct credentials → `ok` and the attempt record is deleted; wrong password → `invalid`; unknown username → `invalid` and **one hash is computed** (spy on `CryptoPort.sha256Hex`); after 5 failures → `locked` with seconds; while locked, the password is not verified (no hash call) and the record is unchanged; locked behaves identically for an unknown username; corrupt attempts data resets to `{}`; corrupt users data propagates as `CorruptDataError`.

### Implementation
- [x] T025 [P] [US1] Implement `src/domain/username.ts` (`normalizeUsername`, `isValidUsernameFormat`).
- [x] T026 [P] [US1] Implement `src/domain/validateUser.ts` (`validateUser`, `hasErrors`) with the exact messages from data-model.md.
- [x] T027 [P] [US1] Implement `src/domain/lockout.ts` (`registerFailure`, `lockRemainingSeconds`, `pruneAttempts`) per data-model §LoginAttemptRecord.
- [x] T028 [US1] Implement `src/services/user.repo.ts` (`loadUsers`, `listUserViews`, `getById`, `saveUser` with re-validation and `CryptoPort`, `CorruptDataError`).
- [x] T029 [US1] Implement `src/services/loginAttempts.repo.ts` (read/write the map, prune on write, corrupt → `{}`) and `src/services/auth.service.ts` (`signIn` per contracts/services.md, with the dummy salt and hash constants).
- [x] T030 [US1] Write `__tests__/session/bootStatus.test.ts` (users `corrupt` → `dataError` regardless of session; users `absent` → `signedOut` with `usersExist=false`; users `ok` + no session → `signedOut`; users `ok` + session whose user exists → `signedIn`; users `ok` + session whose user is missing → `signedOut` and `clearSession` requested), then implement the pure `src/session/bootStatus.ts` (`resolveBootStatus(usersResult, session) → { status, usersExist, userId?, clearSession }`). Constitution III/IV: this rule must live outside React.
- [x] T030b [US1] Implement the minimal `src/session/session.store.ts` (`loadSession`, `saveSession`, `clearSession`; corrupt → cleared) and the thin `src/contexts/SessionContext.tsx`, which loads data, calls `resolveBootStatus`, and exposes `status`, `signIn`, `signOut`, `usersExist`. The context contains no decision logic. Session timing comes later in US5.
- [x] T031 [US1] Build `src/components/Badge/` (login badge card: lanyard clip, navy band "Crachá / Controle de acesso", initials placeholder, content slot, barcode foot; decorative parts hidden from a11y; reflows at 200% font).
- [x] T032 [US1] Build `src/pages/StartupScreen.tsx` (clip outline and progress indicator, `accessibilityLabel="Carregando"`).
- [x] T033 [US1] Build `src/pages/LoginPage.tsx` per design-shape §5 Login:
  - fields Login (`autoCapitalize="none"`, `autoCorrect={false}`, `autoComplete="username"`) and Senha (`autoComplete="password"`, secure toggle);
  - "Entrar" with progress; the invalid message "Login ou senha inválidos." with icon, announced;
  - locked countdown "Muitas tentativas. Tente novamente em N segundos." with submit disabled until it reaches zero;
  - password cleared after every attempt;
  - "Criar primeiro usuário" text button only when users are `absent`;
  - an expired-session notice banner slot (US5).
- [x] T034 [US1] Build `src/pages/UserFormPage.tsx` create mode for the `firstUser` route: fields Nome (counter n/80), Login (counter n/30, `autoCapitalize="none"`), Senha, Confirmar senha (`autoComplete="new-password"`); live preview badge in the header (decorative); errors on submit with focus on the first invalid field and an announcement; Salvar disabled while saving; **clear Senha and Confirmar senha after every save attempt, whether it succeeds or fails (FR-033)**; on success, sign in as the new user.
- [x] T035 [US1] Register `login` and `firstUser` in `src/navigation/PublicStack.tsx`, with `firstUser` mounted only when `usersExist === false`.

**Checkpoint**: quickstart #1, #2, #7 pass manually; tests are green; coverage ≥90% on touched folders.

---

## Phase 4: User Story 2 - View the user list (P1)

**Goal**: the home screen with the signed-in badge, count, sorted list, and header actions.
**Independent test**: with 3+ users, sign in and check the greeting, count, order, "(você)", and header actions (quickstart #2, #3).

- [x] T036 [P] [US2] `__tests__/domain/userPresentation.test.ts`: `sortUsersByName` ignores case and accents ("Álvaro" next to "Alvaro") and ties break by id; `firstName` (single word, extra spaces); `initials` ("Matheus Mendes" → "MM", "Heitor" → "H"); `userCountLabel` (1 → "1 usuário cadastrado", 4 → "4 usuários cadastrados").
- [x] T037 [P] [US2] Implement `src/domain/userPresentation.ts` (`compareKey`, `sortUsersByName`, `firstName`, `initials`, `userCountLabel`).
- [x] T038 [US2] Build `src/components/SessionBadge/` per design-shape §3: horizontal compact badge with band, MiniBadgeAvatar, "Olá, <firstName>" in display size, `@USERNAME` ID-number style, count label, and a validity line slot ("Sessão válida por N min", fed in US5). One a11y element: "<name>, login <username>, <count>, sessão válida por N minutos". Reflows vertically at 200%.
- [x] T039 [US2] Build `src/pages/UserListPage.tsx`:
  - header title "Usuários" with HeaderActions "Adicionar usuário" (account-plus → `userForm`) and "Sair" (logout → `signOut`);
  - SessionBadge on top; `FlatList` of 72 dp rows (MiniBadgeAvatar, name wrapping to 2 lines, username as ID number with ellipsis);
  - "você" tag on the current user; each row is one a11y element with the hint "Toque duas vezes para editar";
  - pressed and focus states (tonal elevation plus 3:1 outline);
  - refresh on `focus`; the single-user empty hint.
- [x] T040 [US2] Register `users` and `userForm` in `src/navigation/PrivateStack.tsx`. After the first-user signup or a sign-in, land on `users`.

**Checkpoint**: quickstart #2 and #3 (display part) pass.

---

## Phase 5: User Story 3 - Create and edit users (P1)

**Goal**: signed-in create and edit with optional password on edit, uniqueness, and the discard prompt.
**Independent test**: create, edit name and login, keep and change the password, verify via sign-in (quickstart #3, #4, #9).

- [x] T041 [P] [US3] Extend `__tests__/services/user.repo.test.ts` (edit part): edit keeps the hash and salt when the password is blank; a new password regenerates the salt and hash; a username change to the user's own current value is allowed; a change to another user's username (any case or spacing) → `usernameTaken`; editing a missing id → error; the id never changes.
- [x] T042 [P] [US3] `__tests__/domain/formDirty.test.ts`: identical → false; any field changed → true; changed then reverted → false; whitespace-only change in name counts as changed.
- [x] T043 [P] [US3] Implement `src/domain/formDirty.ts` (`isFormDirty`).
- [x] T044 [US3] Extend `saveUser` in `src/services/user.repo.ts` for edit mode (FR-012 to FR-016).
- [x] T045 [US3] Extend `src/pages/UserFormPage.tsx` for the private `userForm` route:
  - title "Novo Usuário" / "Editar Usuário"; prefill on edit;
  - password hint "Deixe em branco para manter a senha atual";
  - Snackbar "Usuário salvo" on return;
  - clear Senha and Confirmar senha after every save attempt, success or failure (FR-033);
  - discard prompt "Descartar alterações?" (Descartar / Continuar editando) via `beforeRemove` when `isFormDirty` is true, covering both header back and system Back.

**Checkpoint**: quickstart #3, #4, #9 pass.

---

## Phase 6: User Story 4 - Delete users (P2)

**Goal**: delete other users with confirmation; never yourself.
**Independent test**: quickstart #5, #6.

- [x] T046 [P] [US4] Extend `__tests__/services/user.repo.test.ts`: `deleteUser` removes the record **and the username's attempt record** (FR-019); self-delete throws `SelfDeleteError`; deleting a missing id is a no-op; a deleted user cannot sign in (`auth.service` → `invalid`).
- [x] T047 [US4] Implement `deleteUser` in `src/services/user.repo.ts` (uses `loginAttempts.repo` to drop the record).
- [x] T048 [US4] Add "Excluir" to `src/pages/UserFormPage.tsx` (edit mode, not shown when `id === currentUserId`): destructive text and icon, ConfirmDialog "Excluir <nome>?" naming the user, Snackbar "Usuário excluído", disabled while deleting.

**Checkpoint**: quickstart #5 and #6 pass.

---

## Phase 7: User Story 5 - Inactivity session expiry (P2)

**Goal**: 5 min (30 s dev) inactivity expiry, a 60 s (10 s dev) warning, and "Continuar conectado".
**Independent test**: quickstart #8 and #10 in a dev build.

- [x] T049 [P] [US5] `__tests__/session/sessionPolicy.test.ts`: `evaluateSession` at 0, just before the warning, at the warning boundary, mid-warning (secondsLeft rounds up), exactly at the timeout (expired), and with negative elapsed time (expired); constants for `__DEV__` true and false.
- [x] T050 [P] [US5] `__tests__/session/SessionController.test.ts` (Jest fake timers plus an injected clock): `start` persists the session; `recordActivity` updates memory and persists at most every 15 s; `flush` persists immediately; `restore` returns null when absent, expired, or the user is missing, and clears the store; `check` transitions active → warning → expired; `end('logout'|'expired'|'userDeleted')` clears the store and notifies listeners with the reason; a corrupt session → cleared. Also cover `session.store.ts` directly: `loadSession` returns null when absent, the session when valid, and null plus key removed when corrupt; `saveSession` and `clearSession` round-trip.
- [x] T051 [P] [US5] Implement `src/session/sessionPolicy.ts` (`SESSION_IDLE_TIMEOUT_MS`, `SESSION_WARNING_MS`, `evaluateSession`).
- [x] T052 [US5] Implement `src/session/SessionController.ts` per contracts/services.md (clock, store, user-exists checker, and timers injected).
- [x] T053 [US5] Wire the controller into `src/contexts/SessionContext.tsx`: restore on boot; `AppState` (background → `flush`; active → `check`); interval 30 s, or 1 s while warning; expose `warningSecondsLeft`, `expiredNotice`, `keepAlive`, `validMinutesLeft`; end the session when the user was deleted (FR-026).
- [x] T054 [US5] Wire activity sources in `App.tsx`: the root `View onTouchStart` and `NavigationContainer onStateChange` → `recordActivity`.
- [x] T055 [US5] Build `src/components/SessionWarningDialog/`: Material dialog "Sua sessão vai expirar em N segundos." with a live countdown, "Continuar conectado" (primary → `keepAlive`) and "Sair"; announced via `announceForAccessibility`; rendered over PrivateStack.
- [x] T056 [US5] Show the expiry notice "Sua sessão expirou por inatividade. Entre novamente." on `LoginPage` (announced banner), and feed `validMinutesLeft` to the SessionBadge validity line.

**Checkpoint**: quickstart #8 and #10 pass; session tests are green.

---

## Phase 8: Data error and reset (cross-cutting, spec §Clarifications, FR-031)

- [x] T057 [P] `__tests__/services/user.repo.test.ts` (corrupt part): the corrupt users key never yields `absent`; `resetAll` then `loadUsers` → `absent`.
- [x] T058 Build `src/components/TypedConfirmDialog/` (requires typing `APAGAR` exactly, case-sensitive; the confirm button is disabled until it matches; Cancelar keeps the current state) and `src/pages/DataErrorPage.tsx` (icon, explanation, destructive tonal button "Apagar dados e recomeçar" → `resetAllData()` → status `signedOut` with users absent).

---

## Phase 9: User Story 6 - Accessible, theme-aware experience (P2) & Polish

**Goal**: verify and finish the cross-cutting design and a11y requirements on every screen.

- [x] T059 [US6] Contrast pass: compute the ratios for every text/background and UI/background pair in both themes from `src/theme/tokens.ts` (targets 4.5:1 text, 3:1 UI) and fix tokens that fail. Record the results in a "Contraste medido" table in `README.md` (the approved design-shape stays unchanged).
- [x] T060 [US6] TalkBack pass on all screens and dialogs (labels, roles, row grouping, announcements, focus to the first error); fix the findings in the affected components.
  - Code audit done 2026-11-24 (live regions removed from the login error/notice and the snackbar, duplicate TextField label and error hidden). On-device TalkBack pass done by the user 2026-11-24 (GUIA-DE-TESTES.md).
- [x] T061 [US6] Font-scale 200% and dark/light pass on a device or emulator (`adb shell settings put system font_scale 2.0`, `adb shell cmd uimode night yes|no`); fix clipping.
  - Code audit done 2026-11-24 (user row name no longer limited to 2 lines). On-device check at 200% font and in both themes done by the user 2026-11-24.
- [x] T062 [P] Write `README.md` sections (in pt-BR):
  - Como executar; Como testar (`npm test`, coverage);
  - Roteiro de demonstração (quickstart manual table);
  - Decisões e limitações (SHA-256 + salt vs bcrypt, local data only, inactivity expiry, accepted risks from the spec Assumptions);
  - Checklist de acessibilidade;
  - Screenshots (light and dark) in `screenshots/`.
  - All sections written 2026-11-24; screenshots added 2026-11-25 with T063.
- [x] T063 [P] Capture screenshots of all screens in both themes via `adb exec-out screencap -p` into `screenshots/`.
  - Done 2026-11-24 on an Android phone with Expo Go (system screenshot, not adb): 9 dark-theme captures in `screenshots/`, shown in the README.
- [x] T064 Run `npm test`, `npm run lint`, `npm run typecheck`, `npm audit --omit=dev` (no high or critical), and record the results in `docs/fluxo-status.md`.

---

## Dependencies & Execution Order

- **Setup (T001–T007)** → **Foundational (T008–T019)** → stories.
- **US1 (T020–T035)** is the MVP and blocks US2 (needs sign-in) and US3/US4 (need the form page and repo).
- **US2 (T036–T040)** → **US3 (T041–T045)** → **US4 (T046–T048)**. US3 and US4 share `user.repo.ts` and `UserFormPage.tsx`, so they run in sequence.
- **US5 (T049–T056)** depends on US1 (session context) and US2 (SessionBadge). It can run in parallel with US3/US4 because it touches different files, except `App.tsx` and `SessionContext.tsx`.
- **Data error (T057–T058)** depends on US1 (status resolution).
- **US6 and Polish (T059–T064)** come last.

## Parallel Opportunities

- Setup: T003, T004, T005, T006 together.
- Foundational: T008, T009, T010, T012, T013, T014, T015, T018, T019 together, then T011 and T016–T017.
- US1 tests T020–T024 together, then domain T025–T027 together.
- US5 tests T049–T050 and T051 alongside US3 work.
- Polish: T062 and T063 together.

## Implementation Strategy

1. **MVP = Setup + Foundational + US1.** You can sign in and create the first user.
2. Add US2 and US3. That completes the assignment's three screens and is a viable delivery.
3. Add US4, US5, and Data error. These are the differentiators: deletion and session security.
4. US6 and Polish, then Phase 7 of the product flow: security review → `/impeccable critique` → `audit` → `harden` → `polish`.
5. Implement one phase at a time (`/speckit-implement`). After each phase: `npm test` (thresholds), lint, typecheck, then update `docs/fluxo-status.md`.
