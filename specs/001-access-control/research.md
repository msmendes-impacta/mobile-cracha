# Research: Access Control App (Crachá)

All Technical Context items were resolved; no NEEDS CLARIFICATION remains. Each entry: Decision / Rationale / Alternatives.

## R1. Project bootstrap
- **Decision:** `npx create-expo-app@latest . --template blank-typescript` targeting Expo SDK 58, matching the course reference repo (`uedsonreis/aula_expo_es31`: expo ~58.0.21, react-native 0.88.1, react 19.3.0). Add libraries only with `npx expo install`.
- **Rationale:** The course teaches this template, the evaluator runs it with Expo Go, and `expo install` pins SDK-compatible versions.
- **Alternatives:** The `tabs`/expo-router template was rejected because the reference repo uses React Navigation without expo-router, and we need auth-conditional stacks. A bare React Native CLI project was rejected because it needs Android Studio and gives no gain.

## R2. Navigation and auth gating
- **Decision:** `@react-navigation/native` + `native-stack`. The navigator renders **different screen sets** depending on session status (`loading` | `dataError` | `signedOut` | `signedIn`), following the React Navigation authentication-flow pattern. `NavigationContainer.onStateChange` reports activity.
- **Rationale:** Screens that are not mounted cannot be reached with system Back (FR-025), so no manual history surgery is needed.
- **Alternatives:** A single stack with `navigation.reset` on logout was rejected: it is fragile and Back could still reach protected screens during transitions.

## R3. Password hashing
- **Decision:** `expo-crypto`: `getRandomBytesAsync(16)` produces the salt (hex), and `digestStringAsync(SHA256, salt + password)` the hash (hex). Comparison uses `safeEqual(a, b)`: it XORs char codes over the full length and returns false on length mismatch without an early exit. The hashing sits behind a `CryptoPort` interface. The app injects the expo-crypto adapter; tests inject a Node `crypto` adapter.
- **Rationale:** The brief and constitution require it. The port keeps `src/services` testable in Jest without native modules, which reach the 90% threshold.
- **Alternatives:** bcrypt/argon2 were rejected (native module or too slow in JS; documented as a known limitation). Plain SHA-256 without salt was rejected as rainbow-table prone.

## R4. Username enumeration resistance
- **Decision:** When the username does not exist, still compute `SHA-256(DUMMY_SALT + password)` and compare it against a fixed dummy hash, then return the same `invalidCredentials` result. Lockout state is kept for unknown usernames as well.
- **Rationale:** FR-005 and FR-007 require comparable timing and identical messages.

## R5. Lockout policy
- **Decision:** A pure function `registerFailure(record, now)` and `isLocked(record, now)` in `src/domain/lockout.ts`. After 5 consecutive failures: `lockouts += 1`, `lockedUntil = now + min(30s × 2^(lockouts−1), 300s)`, `failures = 0`. Success deletes the record. Records persist in `auth@attempts@v1` as a map keyed by normalized username. Records whose lock expired and that have no failures are pruned on write, which bounds growth.
- **Rationale:** Pure functions with an injected `now` are trivially testable (constitution IV). Persistence satisfies "survives restart".

## R6. Storage and fail-closed reads
- **Decision:** `storage.ts` exposes `readJson<T>(key, guard)`, which returns `{ status: 'absent' } | { status: 'ok', value: T } | { status: 'corrupt' }`. JSON parse errors and shape-guard failures are `corrupt`. The app routes `corrupt` on the users key to the Data Error screen. Keys: `users@v1`, `session@current`, `auth@attempts@v1`. `resetAll()` uses `multiRemove` on these keys only.
- **Rationale:** FR-031: "absent" and "corrupt" must never be confused, because that would reopen first access.
- **Alternatives:** try/catch returning `[]` was rejected: it is exactly the fail-open bug. SQLite was rejected because the assignment mandates AsyncStorage.

## R7. Session expiry and activity tracking
- **Decision:**
  - A framework-free `SessionController` class in `src/session/` with injected `clock`, `store`, and `timers`. It holds `lastActivityAt` in memory and persists it at most every 15 s and on `AppState` → background.
  - `check(now)` returns `active | warning(secondsLeft) | expired`, delegating to the pure `sessionPolicy.ts` (`isSessionExpired`, `secondsUntilExpiry`, `shouldWarn`).
  - A negative elapsed time (clock moved back) counts as expired.
  - Activity sources are the root `View onTouchStart` and navigation state changes.
  - Checks run on app start, on `AppState` → active, and on an interval: every 30 s normally, every 1 s while the warning is visible for the countdown.
  - The thin React `SessionProvider` (in `src/contexts/`) wires the controller to React state.
  - Timeouts: `SESSION_IDLE_TIMEOUT_MS` is 5 min (30 s if `__DEV__`); `SESSION_WARNING_MS` is 60 s (10 s if `__DEV__`).
- **Rationale:** Keeps all timing logic in tested code (Jest fake timers plus an injected clock). The provider stays a trivial adapter, verified manually.
- **Alternatives:** Logic directly in a React context was rejected (hard to test, timers tangled with renders). Third-party idle libraries were rejected (unneeded dependency).

## R8. Testing setup
- **Decision:**
  - Jest with the `jest-expo` preset.
  - `@react-native-async-storage/async-storage/jest/async-storage-mock` mapped via `jest.setup.ts`.
  - `collectCoverageFrom` covers `src/domain/**`, `src/services/**`, `src/session/**`, with `coverageThreshold` at 90/90/90 (lines, branches, functions) on those paths.
  - `npm test` runs `jest --coverage`.
- **Rationale:** Constitution IV. The official mock behaves like the real API in memory.

## R9. Lint and safety rails
- **Decision:**
  - `eslint-config-expo` plus the rule `no-console: error` for `src/**`.
  - TypeScript `strict: true`.
  - `app.json` sets `android.allowBackup: false`.
  - `npm audit --omit=dev` is checked before delivery.
- **Rationale:** Constitution I and III.

## R10. Theming and design tokens
- **Decision:**
  - `src/theme/` holds the light and dark role tokens (Material-like roles: primary/onPrimary, surface/onSurface, surfaceContainer, outline, error, badgeBand, badgeCard, ground) and the type scale in sp, selected by `useColorScheme()`. There is no Dynamic Color: the navy badge band is the brand.
  - Contrast is verified at build with a small script or manual checker. Targets: 4.5:1 for text and 3:1 for UI.
  - Icons come from `@expo/vector-icons/MaterialCommunityIcons`.
  - The decorative barcode is plain `View` bars, so no `react-native-svg` is needed.
- **Rationale:** Design shape §3 and §7. Plain Views avoid a dependency.

## R11. Name sorting and first name
- **Decision:** `compareKey(name) = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()`. Sort by compare key, then by id for stability. `firstName(name)` is the first whitespace-separated token of the trimmed name.
- **Rationale:** Deterministic in Jest and on Hermes, without relying on full ICU locale data.

## R12. Accessibility implementation notes
- **Decision:**
  - `accessibilityRole` and `accessibilityLabel` on all touchables.
  - Field errors are linked through `accessibilityLabel` composition ("Login, erro: ...").
  - Announcements use `AccessibilityInfo.announceForAccessibility` plus `accessibilityLiveRegion="polite"`.
  - Focus moves to the first invalid field via a ref and `focus()`.
  - Decorative badge parts use `importantForAccessibility="no-hide-descendants"`.
  - `AccessibilityInfo.isReduceMotionEnabled()` selects `animation: 'fade'` or `'none'` for the stack.
  - Text uses `allowFontScaling` (the default) and layouts that grow rather than fixed heights.
- **Rationale:** FR-034 to FR-040 and design shape §7.
