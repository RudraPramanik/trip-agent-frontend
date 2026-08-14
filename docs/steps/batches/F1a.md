# F1a — CLI session: session probe + login/logout

> Run **this file** as the agent prompt (or paste it). Do not also paste all of `StepF1.md`.
> Prompt bodies live in [`../StepF1.md`](../StepF1.md). This file is the session gate.

## Prerequisites

- **F0 ship checklist green** (gateway, generated types, Query + toaster, Wandr `AGENTS.md`).
- Local API up at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) with `GET /api/v1/auth/me` reachable.
- `lib/api/auth.ts` is still a stub. **Do not** install packages. **Do not** add NextAuth / Better Auth.

## Read first

1. [`../../app/system.md`](../../app/system.md) — F0 as-built
2. [`../StepF1.md`](../StepF1.md) — **Locked decisions**, **Failure-mode table**, **Feature buildup**, **Modular layers**
3. Then execute the fenced prompts in `StepF1.md` in this order only:
   - **Step 1.1** — `lib/api/auth.ts` + `useAuthMe`
   - **Step 1.2** — Login CTA + logout

## Session rules

- Complete 1.1, run its VALIDATION, then 1.2, run its VALIDATION.
- HTTP only in `lib/api/auth.ts`. Hooks in `features/auth/`. Proof UI on `/dev/ui` only.
- Login is `location.assign` to `{API}/api/v1/auth/google` — not `getJson`.
- Do **not** start 1.3 (no `session-header`, no `app/layout.tsx` chrome).
- Do **not** call destination search or add Zustand.

## Hard stop

When 1.1 and 1.2 validations pass, **stop**. Do not continue into F1b.

## Proofs (must be green before F1b)

```powershell
Select-String -Path lib\api\auth.ts -Pattern "auth/me"
Select-String -Path lib\api\auth.ts -Pattern "auth/logout"
Select-String -Path features\auth\start-login.ts -Pattern "location.assign"
Select-String -Path features\auth\start-login.ts -Pattern "getJson|sendJson|fetch\("   # Expected: no matches
Select-String -Path app\layout.tsx -Pattern "SessionHeader|session-header"   # Expected: no matches
# Browser: http://localhost:3000/dev/ui shows Guest (or user) + Login/Logout + OAuth-gap helper text
```
