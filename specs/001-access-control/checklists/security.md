# Security & Privacy Requirements Checklist: Access Control App (Crachá)

**Purpose**: Validate that the security and privacy requirements are complete, clear, consistent, and verifiable before implementation and at the security review gate.
**Created**: 2026-11-24
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [contracts/](../contracts/)
**Audience / timing**: reviewer, before `/speckit-implement`, and again at the Phase 7 security review. Depth: thorough.

> Ownership: these items test the **requirements**, not the code. `[x]` means the reviewer judged the requirement-quality criterion satisfied, not that implementation is done. `/speckit-implement` reads this file but never changes the markers.

## Credential Storage

- [x] CHK001 - Is the password storage form specified precisely enough to verify: algorithm, salt length, salt uniqueness per user, and regeneration on every password change? [Clarity, Spec §FR-027, data-model §User]
- [x] CHK002 - Is constant-time comparison stated as a requirement with a verifiable definition, including the length-mismatch case? [Clarity, Spec §FR-027, contracts/services.md]
- [x] CHK003 - Are the password length bounds (6–128) and the "no trimming" rule stated consistently in the spec, data model, and validation messages? [Consistency, Spec §FR-014, Edge Cases]
- [x] CHK004 - Is the hashing-algorithm limitation (fast SHA-256 vs. a slow KDF) documented as an accepted risk with its mitigations? [Assumption, Spec §Assumptions]
- [x] CHK005 - Is the requirement that password fields are cleared after a save or sign-in attempt specified for **both** success and failure outcomes? [Completeness, Spec §FR-033]

## Username Enumeration

- [x] CHK006 - Is "comparable response time" for an unknown username vs. a wrong password defined in a measurable way? [Measurability, Spec §FR-005, SC-004]
- [x] CHK007 - Are the lockout message and timing for unknown usernames required to be identical to those for existing ones? [Consistency, Spec §FR-007]
- [x] CHK008 - Does the spec avoid enumeration through other channels, such as the "Este login já está em uso." message being reachable only by signed-in users and the first-user screen being reachable only with no users? [Coverage, Spec §FR-001, FR-003]

## Brute-Force Lockout

- [x] CHK009 - Are the lockout thresholds, durations, doubling rule, and cap stated with exact numbers and units? [Clarity, Spec §FR-006]
- [x] CHK010 - Is it defined what "consecutive" failures means: what resets the counter and whether a lockout itself resets it? [Clarity, Spec §FR-006, data-model §LoginAttemptRecord]
- [x] CHK011 - Is the behavior of an attempt made while locked specified: the password is not verified and the counter is not changed? [Completeness, data-model §LoginAttemptRecord]
- [x] CHK012 - Is the denial-of-service side effect (anyone can lock out a known username) acknowledged as accepted or mitigated? [Gap, Assumption]
- [x] CHK013 - Is the persistence and growth bound for attempt records (pruning rule) specified, including for unknown usernames? [Completeness, data-model §LoginAttemptRecord]
- [x] CHK014 - Is the fail direction for corrupted attempt data ("no lockout") explicitly justified and consistent with the fail-closed principle? [Consistency, contracts/storage.md, Constitution §I]

## Session Lifecycle & Inactivity Expiry

- [x] CHK015 - Are "activity", the timeout, the warning lead time, and the check moments defined with exact values for production and development builds? [Clarity, Spec §FR-021–FR-023]
- [x] CHK016 - Is the behavior specified when the device clock moves backwards or forwards? [Edge Case, Spec §Edge Cases]
- [x] CHK017 - Is it specified what happens to a session whose user was deleted or whose username changed? [Coverage, Spec §FR-026, Edge Cases]
- [x] CHK018 - Are requirements defined for the session across app restart, backgrounding, and returning after the timeout? [Coverage, Spec §US5]
- [x] CHK019 - Is it unambiguous which screens are "protected", and that none is reachable without a valid session, including via system Back? [Clarity, Spec §FR-025, contracts/screens.md]
- [x] CHK020 - Is the maximum staleness of the persisted last-activity time (throttled writes) bounded and its security impact stated? [Gap, research R7]
- [x] CHK021 - Is the corrupted-session-record behavior defined, and does it fail toward "signed out"? [Edge Case, contracts/storage.md]

## Least Privilege of Session and Navigation Data

- [x] CHK022 - Is the session record's content restricted by requirement to exactly the user id and the last activity time? [Clarity, Spec §FR-029]
- [x] CHK023 - Is the rule "navigation carries ids only" stated for every route, with no exceptions? [Completeness, Spec §FR-030, contracts/screens.md]
- [x] CHK024 - Is it specified that password-derived data (hash, salt) never leaves the service layer toward screens? [Gap, contracts/services.md]

## Fail-Closed Storage & Typed Reset

- [x] CHK025 - Is the distinction between "absent" and "corrupt" stored data defined for each storage key, with the resulting behavior? [Completeness, Spec §FR-031, contracts/storage.md]
- [x] CHK026 - Is the typed confirmation for reset specified exactly: the word, case sensitivity, what is erased, and the cancel behavior? [Clarity, Spec §Clarifications, Edge Cases]
- [x] CHK027 - Is the security trade-off of the in-app reset (anyone holding the device can reset and recreate the first user) documented as accepted, equivalent to the OS "clear data"? [Assumption, Gap]

## Logging, PII & LGPD

- [x] CHK028 - Are all data categories classified (credential, PII, identifier) with an allowed-use statement (finality) for each? [Completeness, Brief §5, Spec §Key Entities]
- [x] CHK029 - Is the "no logging" rule specified for every category, including errors and crash paths? [Coverage, Spec §FR-028]
- [x] CHK030 - Is data minimization explicit, so that no field beyond name, username, and credential material is collected? [Clarity, Constitution §I]
- [x] CHK031 - Is "real deletion" defined to include all records tied to the user (user record and any attempt record keyed by that username)? [Gap, Spec §FR-019]
- [x] CHK032 - Is it stated that no data leaves the device, with no network, analytics, or crash reporting? [Clarity, Spec §FR-032]

## Device Backup & Supply Chain

- [x] CHK033 - Is backup exclusion stated as a requirement with a verifiable acceptance check? [Measurability, Spec §FR-032, quickstart]
- [x] CHK034 - Is the dependency-audit acceptance threshold (no high/critical) and its timing (before delivery) documented? [Clarity, Constitution §I, quickstart]
- [x] CHK035 - Is the dependency policy (Expo SDK modules only, versions pinned by the SDK) stated so new dependencies require justification? [Completeness, Constitution §III, plan Complexity Tracking]

## Accepted Risks & Threat Coverage

- [x] CHK036 - Does every threat in the brief's threat model (A1–A7) map to at least one requirement or an explicitly accepted risk? [Traceability, Brief §3.1]
- [x] CHK037 - Is the "any user can reset another user's password" risk documented in the spec and required to appear in the README? [Completeness, Spec §Assumptions]
- [x] CHK038 - Is the out-of-scope list (biometrics, encryption at rest, screenshot blocking, current-password check) consistent across brief, spec, and plan? [Consistency]

## Notes

- Items marked `[Gap]` may need a spec amendment (via `/speckit-clarify` or a direct edit) before implementation, or an explicit "accepted" note.
- Re-run this review at the Phase 7 security gate against the final diff.

## Review record

- 2026-11-24: Reviewed by the team (Matheus Mendes), who authorized marking it as reviewed. Gaps CHK005, CHK012, CHK020, CHK024, CHK027, and CHK031 were closed by spec amendments. CHK006 (FR-005), CHK016 (Edge Cases), and CHK029 (FR-028) were clarified in the spec. Re-run at the Phase 7 security gate against the final diff.
