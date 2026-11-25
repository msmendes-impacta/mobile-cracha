# Feature Specification: Access Control App

**Feature Branch**: `001-access-control`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Access control mobile app (course assignment, Option 2), based on the approved brief in docs/brief.md: login, user list, create/edit user, local device storage, inactivity session expiry, light/dark themes, WCAG 2.2 AA."

## Clarifications

### Session 2026-11-24

- Q: When stored user data is corrupted, how does the person get out of the error state? → A: An error screen offers "Apagar dados e recomeçar", which requires typing `APAGAR` to confirm. It then erases all app data and returns to first access.
- Q: On the create/edit screen, what happens when the person goes back with unsaved changes? → A: If any field changed, ask "Descartar alterações?" (Descartar / Continuar editando); if nothing changed, go back directly. Session expiry still discards unsaved input.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First access and login (Priority: P1)

On a freshly installed app there are no users. The person opening it creates the first user from the login screen and is signed in. From then on, people sign in with a username and password; wrong credentials never reveal whether the username exists, and repeated failures temporarily lock that username.

**Why this priority**: Without a first user and a working login nothing else is reachable. It is the core of an "access control" app.

**Independent Test**: Install fresh, create the first user, log out, log in with correct and wrong credentials, and trigger a lockout. Delivers a usable gate on its own.

**Acceptance Scenarios**:

1. **Given** no users have ever been stored, **When** the login screen opens, **Then** it offers "Criar primeiro usuário".
2. **Given** the first user was just created through that option, **When** saving succeeds, **Then** that person is signed in and lands on the user list.
3. **Given** at least one user exists, **When** the login screen opens, **Then** no option to create a user is shown.
4. **Given** a registered user, **When** they enter their username in any letter case or with surrounding spaces and the correct password, **Then** they are signed in.
5. **Given** an existing username with a wrong password, or a username that does not exist, **When** they try to sign in, **Then** the same message "Login ou senha inválidos." is shown, with comparable response time in both cases.
6. **Given** 5 consecutive failed attempts for the same username, **When** a 6th attempt is made, **Then** sign-in is refused with "Muitas tentativas. Tente novamente em N segundos." for 30 seconds, also when the username does not exist.
7. **Given** a username already locked once, **When** it is locked again, **Then** the lock lasts twice as long as the previous one, capped at 5 minutes.
8. **Given** a lockout is active, **When** the app is closed and reopened, **Then** the lockout still applies.
9. **Given** earlier failed attempts, **When** the person signs in successfully, **Then** the failure count for that username resets.

---

### User Story 2 - View the user list (Priority: P1)

A signed-in person sees who has access: a greeting with their first name, the number of registered users, and the list of users in alphabetical order with name and username, with their own entry marked.

**Why this priority**: It is the home screen after login and the entry point to every management action.

**Independent Test**: With several users stored, sign in and check the greeting, count, ordering, self marker, and the header actions.

**Acceptance Scenarios**:

1. **Given** a signed-in user named "Matheus Mendes", **When** the list opens, **Then** it greets "Olá, Matheus" and shows "N usuários cadastrados" (singular "1 usuário cadastrado").
2. **Given** several users, **When** the list is shown, **Then** users appear sorted alphabetically by name, ignoring letter case and accents, each showing name and username.
3. **Given** the signed-in user appears in the list, **When** it is shown, **Then** that entry is marked "(você)".
4. **Given** the person returns to the list after creating, editing, or deleting a user, **When** the list is shown again, **Then** it reflects the change without manual refresh.
5. **Given** the list screen, **When** the person taps "Sair", **Then** the session ends and the login screen is shown.
6. **Given** the list screen, **When** the person taps "Adicionar usuário" or a user entry, **Then** the create or edit screen opens respectively.

---

### User Story 3 - Create and edit users (Priority: P1)

A signed-in person registers a new user with name, login, password, and confirmation, or edits an existing user. When editing, the password can be left blank to keep the current one.

**Why this priority**: Explicitly required by the assignment ("cadastro e atualização de usuário").

**Independent Test**: Create a user, edit their name and username, change and keep the password, and verify each change by signing in.

**Acceptance Scenarios**:

1. **Given** the create screen, **When** all fields are valid and the person saves, **Then** the user is stored and the list shows them.
2. **Given** the create screen, **When** password or confirmation is empty, **Then** saving is refused with a message on the field.
3. **Given** the edit screen of an existing user, **When** it opens, **Then** the title reads "Editar Usuário", name and login are pre-filled, and both password fields are empty with the hint "Deixe em branco para manter a senha atual".
4. **Given** the edit screen, **When** the password fields are left blank and the person saves, **Then** the stored password is unchanged.
5. **Given** the edit screen, **When** a new password and a matching confirmation are entered, **Then** only the new password works from then on.
6. **Given** a username already used by another user, in any letter case or with spaces, **When** the person saves, **Then** saving is refused with "Este login já está em uso."
7. **Given** a user edits their own record and keeps their username, **When** saving, **Then** it is not treated as a duplicate.
8. **Given** a user's username is changed, **When** they sign in afterward, **Then** the new username works and the old one does not, and the change does not affect any other record.
9. **Given** invalid fields, **When** the person taps save, **Then** each invalid field shows its own error by text and icon, and focus moves to the first invalid field.
10. **Given** a save is in progress, **When** the person taps save again, **Then** no second save happens.
11. **Given** the person changed at least one field, **When** they go back (header or system back) without saving, **Then** they are asked "Descartar alterações?" with "Descartar" and "Continuar editando"; **When** nothing changed, **Then** they go back directly.

---

### User Story 4 - Delete users (Priority: P2)

A signed-in person removes another user's access. They cannot delete themselves, so at least one user always remains.

**Why this priority**: Revoking access is essential to access control, but the assignment does not demand it explicitly.

**Independent Test**: Delete another user after confirmation; confirm the action is unavailable on one's own record.

**Acceptance Scenarios**:

1. **Given** the edit screen of another user, **When** the person taps "Excluir", **Then** a confirmation naming that user appears.
2. **Given** the confirmation, **When** the person confirms, **Then** the user record is permanently removed and the list no longer shows it; **When** they cancel, **Then** nothing changes.
3. **Given** the edit screen of the signed-in user's own record, **When** it is shown, **Then** no delete action is available.
4. **Given** a deleted user, **When** someone tries to sign in with that username, **Then** they get "Login ou senha inválidos."

---

### User Story 5 - Inactivity session expiry (Priority: P2)

Like a banking app, the session ends after a period without use. The person is warned shortly before and can stay signed in.

**Why this priority**: Protects a shared or forgotten device. It adds security on top of the core flows.

**Independent Test**: In a development build, sign in, stay idle, observe the warning and the expiry, and keep the session alive via the warning.

**Acceptance Scenarios**:

1. **Given** a signed-in person, **When** 5 minutes pass without any touch or screen change (30 seconds in development builds), **Then** the session ends and the login screen shows "Sua sessão expirou por inatividade. Entre novamente."
2. **Given** a signed-in person idle for 4 minutes (20 seconds in development builds), **When** the remaining time reaches 60 seconds (10 seconds in development builds), **Then** a warning "Sua sessão vai expirar em N segundos." appears with "Continuar conectado", and is announced to screen readers.
3. **Given** the warning is visible, **When** the person taps "Continuar conectado", **Then** the inactivity timer restarts and the warning closes.
4. **Given** a signed-in person sends the app to the background, **When** they return after the timeout has passed, **Then** the login screen is shown with the expiry message.
5. **Given** the app was closed while signed in, **When** it is reopened before the timeout, **Then** the person is still signed in; **When** reopened after it, **Then** the login screen is shown.
6. **Given** the session ended (expiry or "Sair"), **When** the person presses the system back button, **Then** no protected screen is shown.
7. **Given** the signed-in user's record was deleted, **When** the session is next checked, **Then** the session ends.

---

### User Story 6 - Accessible, theme-aware experience (Priority: P2)

The app follows the device's light or dark theme and works with a screen reader, large fonts, and reduced motion.

**Why this priority**: A non-negotiable project principle. It cuts across every screen rather than adding a flow.

**Independent Test**: With the screen reader on, maximum font size, and each theme, complete create user → list → edit → logout.

**Acceptance Scenarios**:

1. **Given** the device is in light or dark mode, **When** any screen is shown, **Then** it uses the matching theme, and switching the device theme updates the app.
2. **Given** a screen reader is active, **When** the person moves through any screen, **Then** every control announces its name and role, icon-only buttons included, and each list entry is read as one item (name, login, "você" when applicable, and the hint to edit).
3. **Given** system font size at 200%, **When** any screen is shown, **Then** no text is cut off or overlapping and every action remains reachable.
4. **Given** a form error or a session notice, **When** it appears, **Then** a screen reader announces it.
5. **Given** the device requests reduced motion, **When** screens change, **Then** decorative animations are not played.

---

### Edge Cases

- **Corrupted stored data**: if the stored user data cannot be read, the app shows an error screen and does **not** offer "Criar primeiro usuário". The only way out is "Apagar dados e recomeçar", confirmed by typing `APAGAR`. It erases users, session, and login-attempt records, then returns to first access. Cancelling keeps the error screen. The first-user option otherwise appears only when no user data has ever been stored.
- **Username normalization**: "Matheus", " matheus " and "MATHEUS" are the same username. Characters outside `a-z 0-9 . _ -` are rejected after normalization, not silently stripped.
- **Password whitespace**: leading and trailing spaces are part of the password and are not trimmed.
- **Password length**: fewer than 6 or more than 128 characters is rejected.
- **Edit with only confirmation filled**: treated as a password change attempt; the mismatch error is shown.
- **Name with a single word**: the greeting uses that word.
- **Name with accents or uppercase**: sorting treats "Álvaro" next to "Alvaro" and ignores case.
- **Signed-in user's own username changed**: the session remains valid because it refers to the user's identity, not the username.
- **Lockout for unknown usernames**: behaves exactly like a lockout for existing ones.
- **Rapid double tap on save or delete**: only one operation happens.
- **Typing then erasing back to the original values**: counts as "no changes", so no discard prompt appears.
- **Clock changes on the device**: a backwards jump never extends a session beyond its timeout. If the elapsed time is negative, the session is treated as expired. A forward jump can only shorten the session (it expires earlier), which is the safe direction and is accepted. Lockout durations follow the same clock: a forward jump may end a lockout early. This is accepted, because the password check still guards access.

## Requirements *(mandatory)*

### Functional Requirements

**First access and authentication**

- **FR-001**: System MUST offer creation of the first user from the login screen only when no user data has ever been stored on the device.
- **FR-002**: System MUST NOT ship any default or pre-seeded account.
- **FR-003**: Once at least one user exists, System MUST allow creating users only to a signed-in person.
- **FR-004**: System MUST authenticate with username and password and sign the person in on success.
- **FR-005**: System MUST show the same failure message, "Login ou senha inválidos.", for a nonexistent username and a wrong password, with comparable response time. "Comparable" means both paths perform the same work: exactly one password hash computation and one comparison. So the difference cannot exceed normal run-to-run variation.
- **FR-006**: System MUST lock a username after 5 consecutive failed attempts for 30 seconds, doubling the lock duration on each subsequent lockout up to 5 minutes. The count MUST persist across app restarts and reset on successful sign-in.
- **FR-007**: System MUST apply the lockout behavior and message identically to usernames that do not exist.

**User list**

- **FR-008**: System MUST greet the signed-in person by first name ("Olá, <primeiro nome>") and show the number of registered users with correct singular and plural.
- **FR-009**: System MUST list all users sorted by name, ignoring case and accents, showing name and username and marking the signed-in user with "(você)".
- **FR-010**: System MUST refresh the list whenever the person returns to it.
- **FR-011**: System MUST provide "Sair" and "Adicionar usuário" actions on the list screen and open the edit screen when a user entry is tapped.

**Create, edit, delete**

- **FR-012**: System MUST use one screen for create and edit, titled "Novo Usuário" or "Editar Usuário".
- **FR-012a**: When leaving the create/edit screen without saving after changing any field, System MUST ask for confirmation ("Descartar alterações?"). With no changes, it MUST leave without asking. Session expiry discards unsaved input without asking.
- **FR-013**: System MUST give every user a unique, permanent identifier independent of the username.
- **FR-014**: System MUST validate:
  - name: required, 2 to 80 characters after trimming;
  - username: required, normalized to trimmed lowercase, 3 to 30 characters from `a-z 0-9 . _ -`, unique among other users;
  - password: 6 to 128 characters, not trimmed. Required on create; optional on edit, where blank keeps the current password;
  - confirmation: must equal the password whenever a password is entered.
- **FR-015**: System MUST show each validation error next to its field by text and icon when the person saves, and move focus to the first invalid field.
- **FR-016**: System MUST enforce the validation and uniqueness rules in its data-handling logic as well as on screen, so that no path can store an invalid or duplicate user.
- **FR-017**: System MUST prevent duplicate submissions while a save or delete is in progress.
- **FR-018**: System MUST allow deleting a user only from the edit screen of another user, after an explicit confirmation naming that user, and MUST NOT offer deletion of the signed-in user's own record.
- **FR-019**: Deletion MUST permanently remove the user's record from the device, together with any login-attempt record kept for that username.

**Session**

- **FR-020**: System MUST keep the person signed in across app restarts until they sign out or the session expires.
- **FR-021**: System MUST end the session after 5 minutes without activity. Activity means any touch or screen change. In development builds the timeout MUST be 30 seconds.
- **FR-022**: System MUST check for expiry when the app opens, when it returns from the background, and at least every 30 seconds while in use.
- **FR-023**: System MUST warn 60 seconds before expiry (10 seconds in development builds) with an option "Continuar conectado" that counts as activity.
- **FR-024**: On expiry, System MUST return to the login screen and show "Sua sessão expirou por inatividade. Entre novamente."
- **FR-025**: System MUST make protected screens unreachable when no valid session exists, including through system back navigation.
- **FR-026**: System MUST end the session if the signed-in user no longer exists.

**Security and privacy**

- **FR-027**: System MUST never store, display after entry, or log passwords in readable form. Passwords MUST be stored only in an irreversible, per-user salted form and compared in constant time.
- **FR-028**: System MUST NOT write passwords, password-derived data, names, or usernames to logs, including in error, exception, and crash paths. App code MUST NOT call the console at all, and errors shown to the person MUST use the fixed messages of this spec, never raw error details.
- **FR-029**: The session record MUST contain only the user identifier and the last activity time.
- **FR-030**: Data passed between screens MUST include only user identifiers, never passwords or password-derived data. Password hashes and salts MUST never leave the data-handling layer toward any screen.
- **FR-031**: If stored data cannot be read, System MUST show an error and MUST NOT behave as if no users exist (fail closed). The error screen MUST offer "Apagar dados e recomeçar", which erases all app data only after the person types `APAGAR` to confirm.
- **FR-032**: All data MUST stay on the device: no network transmission, and the app's data MUST be excluded from device backups.
- **FR-033**: Password fields MUST hide input by default and offer an accessible show/hide toggle. They MUST be cleared after a save or sign-in attempt.

**Design and accessibility**

- **FR-034**: System MUST provide complete light and dark themes that follow the device setting.
- **FR-035**: Every interactive element MUST expose an accessible name and role. Icon-only actions MUST have text labels for assistive technology.
- **FR-036**: Text contrast MUST be at least 4.5:1 and UI component contrast at least 3:1 in both themes.
- **FR-037**: Touch targets MUST be at least 48×48 dp.
- **FR-038**: Layouts MUST remain usable at 200% system font size.
- **FR-039**: Form fields MUST have persistent visible labels. Errors and session notices MUST be conveyed by text, not color alone, and announced to screen readers.
- **FR-040**: Decorative animation MUST be disabled when the device requests reduced motion.
- **FR-041**: All user-facing text MUST be in Brazilian Portuguese.

### Key Entities

- **User**: a person with access. Attributes: unique permanent identifier, name, username (normalized, unique), password stored only in salted irreversible form together with its salt.
- **Session**: the current sign-in on the device. Attributes: signed-in user's identifier and time of last activity. At most one at a time.
- **Login Attempt Record**: per normalized username, the count of consecutive failures, the number of lockouts so far, and when the current lock ends. Exists for unknown usernames too.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An evaluator following the README demo script completes the full flow in under 5 minutes on first try: first user → second user → edit → attempted self-delete → delete other → logout → session expiry.
- **SC-002**: A new person can create a user in under 1 minute without guidance.
- **SC-003**: 100% of the business rules (validation, uniqueness, password check, lockout, session expiry, fail-closed) are covered by automated tests, with at least 90% line, branch, and function coverage in the rules code.
- **SC-004**: A failed sign-in for a nonexistent username and for a wrong password are indistinguishable to the person: same message, and response times within the same perceptible range.
- **SC-005**: Inspecting the device's stored app data reveals no readable password for any user.
- **SC-006**: Every screen passes a manual check with the screen reader on, at 200% font size, in both themes, with all actions completed.
- **SC-007**: After the timeout, 100% of attempts to reach protected screens (back button, reopening the app, returning from background) end on the login screen.
- **SC-008**: Any list change is visible immediately upon returning to the list (within 1 second).

## Assumptions

- All signed-in users have the same permissions (no roles). The accepted risk is that any signed-in user can set another user's password. It is documented as a known limitation.
- One device, one app instance: there is no multi-device sync and no concurrent editing by different devices.
- The primary target is Android, with a physical device or emulator. Other platforms are not verified.
- The number of users is small (up to a few hundred), so search and pagination are unnecessary.
- "Development build" refers to the developer/evaluator run mode. Production timings apply otherwise.
- Out of scope: roles/permissions, password recovery, any server or sync, search/filter/pagination, pull-to-refresh, avatars, absolute session cap, biometrics, encrypted storage, screenshot blocking, requiring the current password to change one's own password, web version, automated UI/end-to-end tests.
- **Accepted: lockout as denial of service.** Anyone holding the device can lock a known username for up to 5 minutes by typing wrong passwords. This is accepted because the lock is temporary and protecting against guessing matters more.
- **Accepted: in-app reset.** "Apagar dados e recomeçar" lets anyone holding the device erase all data and create a new first user. This is equivalent to Android's own "Limpar dados" for the app, so it adds no new capability. It is offered only on the corrupted-data screen.
- **Accepted: activity persistence lag.** The last-activity time is saved at most every 15 seconds and when the app goes to the background. After a crash, a session may appear up to 15 seconds less idle than it was. This is negligible against a 5-minute timeout.
- The data-at-rest risk (readable storage on rooted devices) is reduced by salting, by excluding backups, and by minimal data. It is documented rather than eliminated.
