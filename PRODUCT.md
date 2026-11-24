# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

- **Primary: the operator.** Anyone registered in the app, on a single Android device. They sign in, see who has access, and add, edit, or remove users. Every signed-in user has the same permissions; there are no roles.
- **Evaluator.** The course professor (MBA in Software Engineering, Mobile Applications) runs the app from the repository with Expo Go or an emulator, follows the README demo script, and reads the code. Delivery is due 2026-12-03.

## Product Purpose

Crachá is a local access-control app. It implements Option 2 of the course assignment: a login screen, a user list, and a create/update user screen, with data stored on the device. Success means a working, secure, and accessible flow that the evaluator can complete in under 5 minutes, backed by tested business rules.

## Positioning

A small, neutral access gate that treats a classroom exercise as a real product. It has no default account, stores passwords only as salted hashes, locks a username after repeated failures, expires the session after inactivity with a warning first, fails closed on corrupted data, and meets applicable WCAG 2.2 AA in both themes. The scenario is deliberately generic: it does not simulate a company, condominium, or reception desk.

## Operating Context

- One Android phone, physical or emulator, possibly shared. The app works fully offline and nothing leaves the device.
- Short, task-focused sessions: sign in, check or change who has access, sign out or let the session expire.
- The evaluation happens by reading the repository: README, demo script, screenshots in light and dark themes, test coverage report.

## Capabilities and Constraints

- Screens: login (with "Criar primeiro usuário" only when no users exist), user list (greeting, count, alphabetical list, "(você)" marker), create/edit user (with delete and discard confirmation), and an error screen for corrupted data with a typed-confirmation reset.
- Session: expires after 5 min of inactivity (30 s in development builds), with a warning 60 s before (10 s in development builds) and a "Continuar conectado" action.
- Lockout: after 5 consecutive failures for a username, it is locked for 30 s, doubling up to 5 min.
- Terminology: the UI says "Login" for the username field and "Usuários" for people with access. The code uses `username` and `user`.
- UI text is in Brazilian Portuguese; code, comments, and commits are in English.
- The structure of the professor's reference screens must remain recognizable: header with title, list items with name over username, full-width primary buttons.
- Full requirements: `specs/001-access-control/spec.md`. Governing principles: `.specify/memory/constitution.md`.

## Brand Commitments

- Name: **Crachá**. It appears on the app icon, the login screen, and the README.
- Voice: **direct and warm.** Short sentences, address the person as "você", no jargon. Examples: "Olá, Matheus", "Login ou senha inválidos.", "Sua sessão expirou por inatividade. Entre novamente."
- No logo or visual identity exists yet.

## Evidence on Hand

- The assignment's reference screenshots (dark Material screens "Acesso", "Usuários", "Novo Usuário") are in the course material, which is not versioned.
- No real users, testimonials, or data. Sample users in screenshots must be obviously fictional, apart from the team members' own names.

## Product Principles

1. **Safe by default.** Never trade a security property for convenience. Every shortcut in the flow is checked against the threat list.
2. **Nothing lost silently.** Warn before ending a session, confirm before discarding edits or deleting, and fail closed instead of pretending data is empty.
3. **Familiar over clever.** Use the patterns Android users and the evaluator already know. Polish lives in precise details, not novelty.
4. **Accessible is the baseline.** Screen reader, 200% font, both themes, and reduced motion are part of "done", not a later pass.
5. **Small and complete.** Few features, each fully finished, including empty, loading, and error states.

## Accessibility & Inclusion

Applicable WCAG 2.2 AA on Android, verified with TalkBack:

- labels and roles on every control, icon-only buttons included;
- contrast ≥ 4.5:1 for text and ≥ 3:1 for UI components, in light and dark themes;
- touch targets ≥ 48 dp;
- usable at 200% font scale;
- persistent field labels, with errors given by text and icon and announced;
- session timeout warning with an option to extend;
- reduced-motion respected.
