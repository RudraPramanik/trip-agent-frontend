# F5b — CLI session: claim then delete

> Run **this file** as the agent prompt (or paste it). Do not also paste all of `StepF5.md`.
> Prompt bodies live in [`../StepF5.md`](../StepF5.md). This file is the session gate.

## Prerequisites

- **F5a green** (authenticated list; 401/guest → login CTA; empty UI; no claim/delete yet).
- Local API up; auth cookies for claim/delete. Claim is **best-effort** on local Option A until API `FRONTEND_URL` OAuth bounce works — do not block on production bounce.
- Install **no** new packages. Do **not** start day-edit (F6).

## Read first

1. [`../StepF5.md`](../StepF5.md) — locks (claim distinct failure copy; delete `parse: "empty"` / 204; Query invalidation; env/keys)
2. Execute the fenced prompts in `StepF5.md` **in order**, hard-stopping after each fence’s VALIDATION:
   - **Step 5.2** — Claim trip
   - **Step 5.3** — Delete trip

## Session rules

- `claimTrip` POST `parse: "api"`. Primary CTA on trip detail. Do not claim without login.
- Claim failures MUST be distinct: unauthenticated (401) vs session-mismatch vs already-claimed — not one generic toast.
- `deleteTrip` DELETE `parse: "empty"` (204). Confirm before delete. No anonymous delete.
- On claim success: invalidate `["trips","list"]` + `["trips", id]` (+ geojson).
- On delete 204: drop list + detail (+ geojson) cache; navigate away from detail if needed.
- Mutations: **no** automatic retries.
- Pages mount barrels only — no `sendJson` / `useMutation` on `app/trips/page.tsx` or `app/trips/[id]/page.tsx`.
- Do not start F6 (no reorder / add / remove / reoptimize).

## Hard stop

When 5.2 validation passes, run 5.3 next in this session (same batch), then run the **F5 ship checklist** at the bottom of `StepF5.md`. Then **stop**. Do not expand or implement F6 in this session.

If 5.2 is incomplete, **do not** start 5.3.

## Proofs (F5 ship)

```powershell
Select-String -Path lib\api\trips.ts -Pattern "claim"
Select-String -Path lib\api\trips.ts -Pattern 'parse: "empty"'
Select-String -Path features\trips -Pattern "different session|already claimed|already-claimed" -Recurse
Select-String -Path features\trips -Pattern "deleteTrip|useDeleteTrip" -Recurse
Select-String -Path lib\api\trips.ts -Pattern "reorder|reoptimize|AddStop"   # Expected: no matches
Select-String -Path app\trips\page.tsx -Pattern "sendJson|useMutation"   # Expected: no matches
Select-String -Path app\trips\[id]\page.tsx -Pattern "sendJson|useMutation"   # Expected: no matches
# Browser: claim failures distinct; delete confirm → 204 → gone from list

# Full F5 checklist: see StepF5.md "F5 ship checklist"
```

Next (separate planning pass): expand [`../StepF6.md`](../StepF6.md) from outline into full prompts, then run F6 batches.
