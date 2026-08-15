# F6a — CLI session: places picker

> Run **this file** as the agent prompt (or paste it). Do not also paste all of `StepF6.md`.
> Prompt bodies live in [`../StepF6.md`](../StepF6.md). This file is the session gate.

## Prerequisites

- **F5 ship checklist green** (authenticated list; claim distinct failure copy; delete 204; `lib/api/places.ts` still stub; no day-edit).
- Local API up at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000` in `.env.example` → `.env.local`). A trip with a real `destination_id` (places GET is public — auth not required for this batch).
- **No new FE API keys.** Do not copy `LLM_*`, `AUTH0_*`, `MAPTILER_API_KEY`, or other API-repo secrets into FE env. `NEXT_PUBLIC_MAP_STYLE_URL` is optional (F4 map).
- Install **no** new packages. Do **not** add reorder / add / remove / reoptimize.

## Read first

1. [`../../app/system.md`](../../app/system.md) — F5 as-built (no day-edit / places picker yet)
2. [`../StepF6.md`](../StepF6.md) — **Locked decisions**, **Failure-mode table**, **Feature buildup**, **Modular layers**, **Env / keys**
3. Then execute the fenced prompt in `StepF6.md`:
   - **Step 6.2** — Places picker

## Session rules

- HTTP only in `lib/api/places.ts` (`listPlaces` with `parse: "paginated"`). Do **not** put `GET /places` in `lib/api/trips.ts`.
- Hooks and picker UI in `features/places/`. Trip detail MAY import the places **barrel**. MUST NOT import `lib/api/places` from trips.
- Query key `["places", destinationId]`. `destination_id` from `TripOut`. Empty `items` → empty UI. 404 → picker error/empty; **do not** blank the trip day list.
- Read-only picker only. Do **not** start 6.1 (no day-edit mutations).
- Do **not** wrap `/trips/[id]` in required-auth.
- Do **not** run Playwright MCP in this batch.

## Hard stop

When 6.2 validation passes, **stop**. Do not continue into F6b.

## Proofs (must be green before F6b)

```powershell
Select-String -Path lib\api\places.ts -Pattern 'parse: "paginated"'
Select-String -Path lib\api\trips.ts -Pattern "/api/v1/places"   # Expected: no matches
Select-String -Path lib\api\trips.ts -Pattern "reorder|reoptimize|addDayStop|removeDayStop"   # Expected: no matches
Select-String -Path features\trips -Pattern "lib/api/places" -Recurse   # Expected: no matches
Test-Path features\places\places-picker.tsx
# Browser: /trips/{id} picker lists or empty/404; day list still visible; no day-edit HTTP
```
