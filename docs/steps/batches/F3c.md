# F3c — CLI session: progress + terminals + clarification

> Run **this file** as the agent prompt (or paste it). Do not also paste all of `StepF3.md`.
> Prompt bodies live in [`../StepF3.md`](../StepF3.md). This file is the session gate.

## Prerequisites

- **F3b green**, including the **server-side abort-integrity proof** (Cancel/navigate actually cancels the API background task).
- Install **`zustand` once** at 3.3. Do not add `motion`, Vitest, `react-markdown`, or MapLibre.
- Clarification is a **fresh** POST (`raw_input = original + newline + answer`). There is no resume endpoint.

## Read first

1. [`../StepF3.md`](../StepF3.md) — locks (terminals, clarification re-submission, Option A Zustand, stub trip route)
2. Execute the fenced prompt in `StepF3.md`:
   - **Step 3.3** — Progress UI + terminals + clarification

## Session rules

- Progress panel: cache hit without `tool_*` is OK. Unknown events ignored.
- `itinerary_done` → navigate `/trips/{trip_id}` **only** if `trip_id` is non-empty. Stub `app/trips/[id]/page.tsx`. No `GET /trips/{id}`.
- `clarification_needed` is terminal, not an error. Inline question (not a blocking modal). `buildClarificationRawInput` + new `AbortController` + reset progress.
- `store/narrative.ts` is thin Zustand Option A keyed by `trip_id`. Hard reload may drop prose. No narrative API.
- `lib/api/planner.ts` stays a stub. Destinations still MUST NOT POST generate.
- Do not wrap `/generate` in required-auth. Do not start F4.

## Hard stop

When 3.3 validation passes, run the **F3 ship checklist** at the bottom of `StepF3.md`. Then **stop**. Do not expand or implement F4 in this session.

## Proofs (F3 ship)

```powershell
Select-String -Path lib\sse\planner.ts -Pattern "buildClarificationRawInput"
Test-Path features\planner\progress-panel.tsx
Test-Path features\planner\clarification-form.tsx
Test-Path store\narrative.ts
Test-Path app\trips\[id]\page.tsx
Select-String -Path package.json -Pattern '"zustand"'
Select-String -Path lib\api\planner.ts -Pattern "export \{\}"
Select-String -Path app\generate\page.tsx -Pattern "getJson|useQuery|sendJson|EventSource|fetch"   # Expected: no matches
Select-String -Path features\destinations -Pattern "planner/generate" -Recurse   # Expected: no matches
# Browser: progress updates; clarification → new POST with newline; navigate only with trip_id; stub trip page (not 404)

# Full F3 checklist: see StepF3.md "F3 ship checklist"
```

Next (separate planning pass): expand [`../StepF4.md`](../StepF4.md) from outline into full prompts, then run F4 batches.
