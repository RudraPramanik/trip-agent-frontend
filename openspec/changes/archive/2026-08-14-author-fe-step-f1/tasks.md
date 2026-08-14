## 1. Built-so-far snapshot

- [x] 1.1 Add `docs/app/system.md`: short F0-as-built tree (gateway, generated types, providers, env, stubs still empty). Cite `AGENTS.md` / `docs/blueprint.md`; do not copy hard rules. No application code.

## 2. F1 phase bible

- [x] 2.1 Replace `docs/steps/StepF1.md` outline with the phase header from `_template.md`: how to use, F0-ship prerequisites, conventions, architecture (modular layers from `design.md`), locked decisions (cookie client, no NextAuth, no packages, search placeholder, login = `location.assign`), failure table, feature buildup, LLD patterns, recommended batches F1a/F1b. Link `docs/app/system.md`.
- [x] 2.2 Add the fenced prompt for **Step 1.1** (auth HTTP module + `useAuthMe` + `/dev/ui` readout). Lock paths: `lib/api/auth.ts` (getMe only in this step), `features/auth/use-auth-me.ts`, Query key `["auth","me"]`, `skipErrorToast` on 401, guest fallback + reconnect. Do NOT jump to login/header. PowerShell VALIDATION.
- [x] 2.3 Add the fenced prompt for **Step 1.2** (logout via gateway + login navigation + §11 helper text). Lock: `logout` in `lib/api/auth.ts`, `use-logout.ts`, `start-login.ts` uses `location.assign` not `getJson`. No header chrome yet. PowerShell VALIDATION.
- [x] 2.4 Add the fenced prompt for **Step 1.3** (session header compose-only). Lock: `session-chip.tsx`, `session-header.tsx`, mount from `app/layout.tsx`; Search is a guest-reachable placeholder (no destinations fetch); header has no `fetch`/`getJson`/`getMe`. End with F1 ship checklist. PowerShell VALIDATION.

## 3. CLI batches

- [x] 3.1 Write `docs/steps/batches/F1a.md` (1.1 → 1.2): API-up prerequisite, read pointers into `StepF1.md`, session rules, hard stop, proofs. Do not inline prompt bodies.
- [x] 3.2 Write `docs/steps/batches/F1b.md` (1.3): F1a-green prerequisite, compose-only rule, hard stop, proofs, pointer at F1 ship checklist. Do not start F2.

## 4. Runner index

- [x] 4.1 Update `docs/steps/README.md` with an F1 batches table (F1a, F1b) next to the F0 table. Keep write grain vs run grain. Leave `StepF2.md`–`StepF7.md` as outlines.

## 5. Docs-only guard

- [x] 5.1 Confirm no application files changed (`lib/api/auth.ts` and `features/auth/index.ts` still stubs; no new packages). This change authors playbooks only.
