# F3a — CLI session: compose PlanRequest

> Run **this file** as the agent prompt (or paste it). Do not also paste all of `StepF3.md`.
> Prompt bodies live in [`../StepF3.md`](../StepF3.md). This file is the session gate.

## Prerequisites

- **F2 ship checklist green** (search, readiness, Generate enabled at every tier and MUST NOT POST generate).
- Local API up at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) with a selectable destination (or a known uuid in `?destination=`).
- `lib/sse/planner.ts` and `features/planner/index.ts` are still stubs. **Do not** install packages (RHF/Zod already present). **Do not** add SSE, EventSource, or Zustand.

## Read first

1. [`../../app/system.md`](../../app/system.md) — F2 as-built (readiness Generate does not POST; planner still stubs)
2. [`../StepF3.md`](../StepF3.md) — **Locked decisions**, **Failure-mode table**, **Feature buildup**, **Modular layers**
3. Then execute the fenced prompt in `StepF3.md`:
   - **Step 3.1** — Compose `PlanRequest`

## Session rules

- Compose lives on `/generate`. Home Generate becomes a `Link` to `/generate?destination=`.
- `app/generate/page.tsx` mounts the planner barrel only. No `getJson` / `useQuery` / `fetch` / `EventSource` on the page.
- Zod mirrors generated `PlanRequest`. Invalid `raw_input` → no POST.
- Destinations feature MUST NOT import planner SSE or call `/planner/generate`.
- Do **not** start 3.2 (no `lib/sse/planner.ts` generate client).
- Do **not** wrap `/generate` in required-auth.

## Hard stop

When 3.1 validation passes, **stop**. Do not continue into F3b.

## Proofs (must be green before F3b)

```powershell
Test-Path app\generate\page.tsx
Test-Path features\planner\compose-form.tsx
Select-String -Path features\destinations\readiness-card.tsx -Pattern "/generate"
Select-String -Path features\planner -Pattern "planner/generate|EventSource|getJson|sendJson" -Recurse   # Expected: no matches
Select-String -Path app\generate\page.tsx -Pattern "getJson|useQuery|sendJson|EventSource|fetch"   # Expected: no matches
Select-String -Path lib\sse\planner.ts -Pattern "export \{\}"
# Browser: Generate from home → /generate?destination=; empty raw_input → no POST
```
