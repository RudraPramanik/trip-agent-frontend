# F4a — CLI session: trip detail from API

> Run **this file** as the agent prompt (or paste it). Do not also paste all of `StepF4.md`.
> Prompt bodies live in [`../StepF4.md`](../StepF4.md). This file is the session gate.

## Prerequisites

- **F3 ship checklist green** (compose, abortable SSE, clarification fresh POST, stub `/trips/[id]`, Zustand Option A).
- Local API up at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) with a known `trip_id` (from generate navigate or a uuid).
- `lib/api/trips.ts` and `features/trips/index.ts` are still stubs. Install **only** `react-markdown` and `remark-gfm`. **Do not** add `rehype-raw`, MapLibre, Vitest, claim, or trip list.

## Read first

1. [`../../app/system.md`](../../app/system.md) — F3 as-built (stub trip page; `lib/api/trips.ts` stub)
2. [`../StepF4.md`](../StepF4.md) — **Locked decisions**, **Failure-mode table**, **Feature buildup**, **Modular layers**
3. Then execute the fenced prompt in `StepF4.md`:
   - **Step 4.1** — Trip detail from API

## Session rules

- HTTP only in `lib/api/trips.ts` (`getTrip` only). Hooks and UI in `features/trips/`.
- `app/trips/[id]/page.tsx` mounts the trips barrel. It must not call `getJson` / `useQuery` / MapLibre.
- Two 403 panels by viewer context (`useAuthMe` `is_guest`). Guest-mismatch copy has **no** login CTA.
- Narrative via `react-markdown` + `remark-gfm` only. No `rehype-raw` / `dangerouslySetInnerHTML`.
- Do **not** start 4.2 (no GeoJSON, no MapLibre).
- Do **not** wrap `/trips/[id]` in required-auth. Do not add claim or trip list.

## Hard stop

When 4.1 validation passes, **stop**. Do not continue into F4b.

## Proofs (must be green before F4b)

```powershell
Select-String -Path lib\api\trips.ts -Pattern "trips/\{trip_id\}"
Select-String -Path lib\api\trips.ts -Pattern "geojson|claim"   # Expected: no matches yet
Select-String -Path package.json -Pattern "react-markdown"
Select-String -Path package.json -Pattern "rehype-raw|maplibre"   # Expected: no matches yet
Select-String -Path features\trips -Pattern "rehype-raw|dangerouslySetInnerHTML" -Recurse   # Expected: no matches
Select-String -Path app\trips\[id]\page.tsx -Pattern "getJson|useQuery|MapLibre|maplibre"   # Expected: no matches
# Browser: /trips/{id} shows days/stops (not F3 stub); hard reload may omit narrative; guest 403 ≠ ownership 403
```
