# F5a — CLI session: my trips list

> Run **this file** as the agent prompt (or paste it). Do not also paste all of `StepF5.md`.
> Prompt bodies live in [`../StepF5.md`](../StepF5.md). This file is the session gate.

## Prerequisites

- **F4 ship checklist green** (trip detail from `TripOut`; dual 403 panels; MapLibre list-first; `getTrip` + `getTripGeojson` only).
- Local API up at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`). Authenticated cookie path available for list proofs (local Option A).
- **No new FE API keys.** `NEXT_PUBLIC_MAP_STYLE_URL` is not required for this batch.
- Install **no** new packages. Do **not** add claim, delete, or day-edit.

## Read first

1. [`../../app/system.md`](../../app/system.md) — F4 as-built (no list / claim / delete yet)
2. [`../StepF5.md`](../StepF5.md) — **Locked decisions**, **Failure-mode table**, **Feature buildup**, **Modular layers**, **Env / keys**
3. Then execute the fenced prompt in `StepF5.md`:
   - **Step 5.1** — My trips list

## Session rules

- HTTP only in `lib/api/trips.ts` (`listTrips` with `parse: "paginated"`). Keep `getTrip` / `getTripGeojson`.
- Hooks and UI in `features/trips/`. `app/trips/page.tsx` mounts the trips barrel only — no `getJson` / `useQuery` / `fetch`.
- Query key `["trips","list"]`. Enabled when authenticated. Empty `items` → empty UI. 401 / guest → login CTA (no fake list).
- Do **not** start 5.2 or 5.3 (no claim, no delete).
- Do **not** wrap `/trips/[id]` in required-auth.

## Hard stop

When 5.1 validation passes, **stop**. Do not continue into F5b.

## Proofs (must be green before F5b)

```powershell
Select-String -Path lib\api\trips.ts -Pattern 'parse: "paginated"'
Select-String -Path lib\api\trips.ts -Pattern "claim|deleteTrip"   # Expected: no matches yet
Select-String -Path features\trips -Pattern 'trips","list"|"trips", "list"' -Recurse
Select-String -Path app\trips\page.tsx -Pattern "getJson|useQuery|fetch|sendJson"   # Expected: no matches
Test-Path app\trips\page.tsx
# Browser: logged-in /trips → items or empty UI; guest → login CTA, no spinning fake list
```
