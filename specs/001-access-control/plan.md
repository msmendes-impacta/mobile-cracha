# Implementation Plan: Access Control App (Crachá)

**Branch**: `001-access-control` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-access-control/spec.md`, design shape [design-shape.md](design-shape.md)

## Summary

An Android-first Expo app with three core screens (login, user list, create/edit user) plus startup, data-error, and session-warning states. It stores users locally with salted SHA-256 hashes, enforces lockout and inactivity session expiry, and implements the approved "Crachá Corporativo" visual direction on Material 3 conventions. Business rules live in pure, 90%-covered modules (`src/domain`, `src/services`, `src/session`). React screens and contexts are thin adapters over them. See [research.md](research.md) for each decision.

## Technical Context

**Language/Version**: TypeScript (strict) on React 19.3 / React Native 0.88 via Expo SDK 58

**Primary Dependencies**:
- `expo`
- `@react-navigation/native`, `@react-navigation/native-stack`
- `react-native-screens`, `react-native-safe-area-context`
- `@react-native-async-storage/async-storage` 2.2.0
- `expo-crypto`
- `@expo/vector-icons`
- `expo-status-bar`

**Storage**: AsyncStorage. Three versioned keys ([contracts/storage.md](contracts/storage.md)).

**Testing**: Jest + `jest-expo`, the official AsyncStorage jest mock, and a node:crypto `CryptoPort` in tests. Coverage threshold 90/90/90 on `src/domain`, `src/services`, `src/session`.

**Target Platform**: Android (Expo Go and emulator). iOS is not verified; web is not a target.

**Project Type**: mobile-app (single Expo project, no backend)

**Performance Goals**: interactions feel instant. A list change is visible within 1 s of returning (SC-008). Sign-in completes in under 1 s on a mid-range device (one SHA-256).

**Constraints**:
- offline only; no network;
- no PII in logs;
- `allowBackup=false`;
- WCAG 2.2 AA (applicable);
- usable at 200% font scale;
- light and dark themes;
- delivery by 2026-12-03.

**Scale/Scope**: up to a few hundred users, one device, 6 screens and states, about 40 source files.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | How the plan complies | Status |
|---|---|---|
| I. Security & Privacy | Salted SHA-256 via `expo-crypto` behind `CryptoPort` and `safeEqual`. Dummy hash for unknown usernames. Lockout in `src/domain/lockout.ts`. `saveUser` re-validates (defense in depth). Session holds only `userId` and `lastActivityAt`. Params carry ids only. Fail-closed `ReadResult`. `allowBackup=false`. `no-console` lint. `npm audit` at delivery. No default account. | ✅ |
| II. Accessible, Theme-Aware Design | `src/theme` light and dark role tokens with verified contrast. Approved design-shape is the UI source. a11y roles and labels, announcements, focus-to-error, 48 dp targets, reduced-motion stack animation, session warning (R12). | ✅ |
| III. Maintainable Code | English code, pt-BR UI strings. Pure rules in `src/domain`. The reference repo's folder layout plus `domain`, `session`, `contexts`, `theme`. Strict TS. Expo-only deps via `npx expo install`. | ✅ (see Complexity Tracking for the two extra folders) |
| IV. Tested Business Rules | Jest + jest-expo. Threshold 90% on the three rule folders. `now` and clock injected. AsyncStorage mock. UI verified manually via quickstart §Manual validation. | ✅ |
| V. Scope Discipline | Only spec items. No search, roles, or backend. No new library beyond the stack list. Barcode uses plain Views (no `react-native-svg`). | ✅ |

**Post-design re-check (after Phase 1):** ✅ All five still hold. The contracts expose no password-derived data to screens. The session controller keeps timing logic testable. Data error and reset follow the clarified spec.

## Project Structure

### Documentation (this feature)

```text
specs/001-access-control/
├── spec.md
├── design-shape.md      # approved UI shape (Gate 3)
├── plan.md              # this file
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── storage.md
│   ├── services.md
│   └── screens.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
App.tsx                      # providers + RootNavigator
index.ts
app.json                     # name "Crachá", android.allowBackup=false, userInterfaceStyle=automatic
jest.config.js / jest.setup.ts
eslint.config.js
src/
├── models/                  # user.ts, session.ts, loginAttempt.ts, formTypes.ts
├── domain/                  # PURE, ≥90%: username.ts, validateUser.ts, lockout.ts, safeEqual.ts,
│                            #   userPresentation.ts (sort, firstName, initials, count label), formDirty.ts
├── services/                # ≥90%: storage.ts, crypto.port.ts, expoCrypto.adapter.ts,
│                            #   password.service.ts, user.repo.ts, loginAttempts.repo.ts, auth.service.ts
├── session/                 # ≥90%: sessionPolicy.ts, session.store.ts, SessionController.ts
├── contexts/                # SessionContext.tsx (thin React adapter)
├── navigation/              # RootNavigator.tsx, PublicStack.tsx, PrivateStack.tsx, types.ts
├── theme/                   # tokens.ts (light/dark roles), typography.ts, useTheme.ts
├── components/              # Badge/, SessionBadge/, MiniBadgeAvatar/, TextField/, PrimaryButton/,
│                            #   ConfirmDialog/, TypedConfirmDialog/, SessionWarningDialog/, Snackbar/, HeaderAction/
└── pages/                   # StartupScreen.tsx, LoginPage.tsx, UserListPage.tsx, UserFormPage.tsx, DataErrorPage.tsx
__tests__/                   # mirrors src/domain, src/services, src/session (+ test crypto adapter)
```

**Structure Decision**: A single Expo project following the professor's reference layout (`src/pages`, `src/components`, `src/models`, `src/services/*.repo.ts`), extended with `src/domain` and `src/session` (required by the constitution) and with `src/contexts`, `src/navigation`, `src/theme` for separation of concerns. This is the Expo managed workflow: no native `android/` or `ios/` folders are committed (they are gitignored).

## Complexity Tracking

| Addition | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| `CryptoPort` interface + adapter | `expo-crypto` native calls are not available in Jest. Without the port, the password and auth services could not reach 90% coverage. | Mocking `expo-crypto` per test would duplicate fake hashing and could hide real hash/compare bugs. |
| `SessionController` class outside React | Timing, throttled persistence, and expiry must be unit-tested with an injected clock. | Logic inside a context `useEffect` is hard to test deterministically and would fall outside the coverage folders. |
| Extra folders `contexts/`, `navigation/`, `theme/` | Keep screens thin and the theme in one place, as the design-shape requires. | Putting them in `components/` would mix providers, navigators, and tokens with visual components. |
