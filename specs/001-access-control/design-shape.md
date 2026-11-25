# Design Shape: Crachá (Access Control App)

> Output of `/impeccable shape` from 2026-11-24. Source: [spec.md](spec.md), [PRODUCT.md](../../PRODUCT.md). Awaiting approval at **Gate 3**.
> Visual direction chosen on the decision page: **Crachá Corporativo** (IMPECCABLE’S PICK; roll `seed:3fd6c3be9271a0ff`). Build path: code-led. Composition reference: `.impeccable/mocks/decision/model-pick.html`.

## 1. Job and audience

- **Who:** the operator of a shared Android phone (any registered user), plus the course evaluator following the README demo script.
- **Context:** short task sessions: sign in, check who has access, add, edit, or remove someone, then leave.
- **Mode:** **Operate.** Scanability, Material 3 conventions, and system Back come first. The brand lives in precise details.
- **Anti-goals the team named:** it must not look like a generic template, and it must not leave Android/Material (no iOS-like or invented controls).
- **Ambition:** every screen gets the same high level of craft. No single "hero" screen.

## 2. Outcome and proof

- **Primary tasks:**
  - sign in;
  - read the list of people with access;
  - create, edit, or delete a user.
- **Success:** the evaluator completes the demo script in under 5 minutes and recognizes the assignment's three screens, with security and accessibility visible in the behavior: lockout message, session warning, announced errors.
- **Product truth to show:** the app treats access like a physical ID badge. Each person is a badge (name, login, initials). The signed-in person's badge carries the session validity, the way a visitor badge carries its expiry.

## 3. Selected direction: "Crachá Corporativo"

**Thesis.** Each person is a badge. The app's one signature object is the PVC ID badge: a white card, a solid color band at the top, an initials "photo", and the login printed like an ID number. Everything around it is plain Material 3.

**What the world contributes (Operate mode: type, palette, density, one signature move):**

- **Palette.** A committed navy band (`#0B3D91` in light, lifted for dark) for the badge bands, the primary actions, and the shell accent. White badge card on a cool blue-gray ground (`#E8EDF3`). Ink `#1A1C1E`. Red only for errors and destructive actions. The dark theme is a real scheme, not an inversion: deep blue-gray ground, the badge card one tonal step up, a lighter band. Final tokens get fixed at build, with contrast verified.
- **Type.** Roboto on the Material type scale, in sp. A display role is used for real: the greeting is set large on the signed-in badge, not as a medium title. The login renders as an "ID number" in tabular, tracked caps (for example `@MATHEUS`).
- **Density.** Material comfortable density on a strict 8 dp grid. List rows are exactly 72 dp.
- **Signature move: the badge.**
  - **Login:** the form lives inside one centered badge card, with a lanyard clip at the top, a navy band with "Crachá / Controle de acesso", a placeholder for the initials photo, the fields, and a decorative barcode foot. The barcode is hidden from screen readers.
  - **List:** the top of the screen shows the signed-in person's own badge, horizontal and compact: band, initials, "Olá, Matheus" in display size, `@MATHEUS`, "4 usuários cadastrados", and a **validity line**, "Sessão válida por 4 min", that counts down with the session. List rows are **not** cards. Each row has a small rounded-square "mini badge" avatar (initials, navy band strip on top), the name, and the login as an ID number.
  - **Create/edit:** the screen header shows a live preview badge that updates as the person types the name and login (the initials and the login ID update). The badge is decorative and hidden from screen readers, because the fields already carry that information.

**Disciplines kept from the declined challengers:** display-size greeting (Metro); one expressive element per screen, with everything else quiet (Saville); visible length counters on Nome (n/80) and Login (n/30) (cassette J-card); strict 8 dp grid (Crouwel); unmistakable focus and pressed states, using tonal elevation and a 3:1 focus outline (streaming wall).

**Implementation consequence.** Standard React Native Material-style components with a single `theme.ts` (light and dark role tokens) and three bespoke pieces: `Badge` (login card), `SessionBadge` (list header), `MiniBadgeAvatar` (rows and edit preview). No UI kit.

## 4. Scope and boundaries

- **Fidelity:** production-ready screens for every state below. Visual craft is part of the deliverable.
- **Screens:**
  - Login (with first-access variant and lockout state);
  - User list;
  - Create/Edit user;
  - Data error (corrupted storage) with typed reset;
  - Startup loading;
  - Session warning dialog.
- **Untouched:** the Material 3 interaction model, system Back, header placement of "Sair" and "Adicionar usuário" (from the assignment's reference), and full-width primary buttons.
- **Explicit anti-goals:**
  - nested cards in the list;
  - badges in every row (only mini avatars);
  - gradients, glassmorphism, or illustrations;
  - a barcode that pretends to be functional;
  - lanyard or PVC skeuomorphism beyond the one clip and the band.

## 5. States and ranges

| Screen | States |
|---|---|
| Startup | brief loading (the badge clip outline with a progress indicator), then routes to Login, List, or Data error |
| Login | default; **first access** (the badge shows "Nenhum usuário cadastrado", one line of explanation, and a filled "Criar primeiro usuário" button instead of the sign-in form; changed after the 2026-11-24 critique, because the form could not be used and the old text button under the badge could fall below the fold); submitting (button shows progress and is disabled); invalid credentials (error text with icon under the form, announced); **locked** (error with countdown "Tente novamente em 27 s", submit disabled until it reaches zero); **session expired** notice (snackbar-like banner at the top of the badge, announced) |
| List | 1 user (only "você", with a hint to add someone); typical 3–15; up to a few hundred (virtualized); long names wrap to 2 lines, never truncate the name; very long logins truncate with ellipsis, full value in the accessibility label |
| Create/Edit | create; edit (password hint "Deixe em branco para manter a senha atual"); validation errors per field; saving; delete confirmation dialog (names the user, destructive button text "Excluir"); discard-changes dialog; self-edit (no delete action) |
| Session warning | Material dialog "Sua sessão vai expirar em 60 s" with a live countdown and "Continuar conectado" (primary) and "Sair" (text). Announced. |
| Data error | full-screen message, icon, explanation, "Apagar dados e recomeçar" (destructive tonal button) that opens a dialog requiring `APAGAR` typed |

**Ranges:** names 2–80 chars, logins 3–30 chars, and 1 to a few hundred users. Font scale up to 200%: the badge reflows vertically, the greeting wraps, and nothing clips.

## 6. Interaction and layout

- **Navigation:** native stack. Logged out: Login → (first access) Create user. Logged in: List → Create/Edit. The session dialog can appear over any logged-in screen.
- **List header (top app bar):** title "Usuários"; actions "Adicionar usuário" (person-add icon) and "Sair" (logout icon), each 48 dp with labels. A FAB is not used, because the reference puts "add" in the header and one primary action per screen is already the header's.
- **Feedback:**
  - snackbar after save or delete ("Usuário salvo", "Usuário excluído");
  - inline field errors on submit, with focus on the first invalid field;
  - pressed state uses the Material ripple plus tonal elevation.
- **Motion:** Material shared-axis for stack navigation. The validity line ticks without animation. With reduced motion, transitions become crossfades or instant cuts.
- **Keyboard:** "next" moves between fields, the last field submits, and the form scrolls with the keyboard (IME insets).
- **Insets:** edge-to-edge with status, navigation, and IME insets applied.

## 7. Constraints and open decisions

- **Platform:** Android, Material 3 conventions. iOS is not verified.
- **Accessibility:** WCAG 2.2 AA (see spec FR-034 to FR-040). The decorative badge parts (clip, barcode, preview badge) are hidden from TalkBack. The SessionBadge reads as "Matheus Mendes, login matheus, 4 usuários cadastrados, sessão válida por 4 minutos".
- **Localization:** UI text in pt-BR. Code identifiers in English.
- **Decided at build, not here:** exact token values (verified for contrast in both themes), icon set (`@expo/vector-icons` MaterialCommunityIcons), and whether the decorative barcode uses a font or an SVG (prefer SVG, so no extra font).
- **Not open:** the builder must not add a FAB, swap the header actions, turn rows into cards, or introduce a second accent color.
