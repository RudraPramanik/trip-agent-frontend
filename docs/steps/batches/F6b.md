# F6b — CLI session: day-edit mutations

> Run **this file** as the agent prompt (or paste it). Do not also paste all of `StepF6.md`.
> Prompt bodies live in [`../StepF6.md`](../StepF6.md). This file is the session gate.

## Prerequisites

- **F6a green** (read-only places picker; 404/empty without blanking trip; no day-edit mutations yet).
- Local API up; authenticated **owner** cookies for mutation proofs. `NEXT_PUBLIC_API_URL` in `.env.local`.
- **No new FE API keys.** Reoptimize is a JSON POST — LLM keys stay on the API, not the FE.
- Install **no** new packages. Do **not** install `@playwright/test` (use Playwright MCP). Do **not** start F7.

## Read first

1. [`../StepF6.md`](../StepF6.md) — locks (four clients `parse: "api"`; remove-stop is **200 not 204**; add-stop uses picker; invalidate trip + geojson; no mutation retry; env/keys; Playwright MCP last)
2. Execute the fenced prompt in `StepF6.md`:
   - **Step 6.1** — Edit mutations

## Session rules

- `reorderDayStops` PATCH, `addDayStop` POST, `removeDayStop` DELETE `parse: "api"` (HTTP 200 TripOut — **not** `parse: "empty"`), `reoptimizeDay` POST no body.
- Add-stop MUST use the 6.2 places picker (inline/sheet). Trips MUST NOT import `lib/api/places`.
- Reorder via up/down (`ReorderStopsIn.place_ids`). No `@dnd-kit`.
- Mutations: **no** automatic retries. **No** optimistic UI. On success invalidate/set `["trips", id]` + `["trips", id, "geojson"]`.
- Guests: hidden/disabled controls. Distinct 401 / 403-guest / 403-owner / 409 duplicate / 422 / 429 copy.
- Reoptimize is **not** SSE — do not use `EventSource` or `lib/sse/planner.ts`.
- Pages mount barrels only — no `sendJson` / `useMutation` on `app/trips/[id]/page.tsx`.
- Do not start F7.

## Hard stop

When 6.1 validation passes (PowerShell **and** Playwright MCP last), run the **F6 ship checklist** at the bottom of `StepF6.md`. Then **stop**. Do not expand or implement F7 in this session.

If MCP tools are unavailable, **fail** the validation (not a silent pass). Manual fallback only with the same checklist written down.

## Proofs (F6 ship)

```powershell
Select-String -Path lib\api\trips.ts -Pattern "reorderDayStops|addDayStop|removeDayStop|reoptimizeDay"
Select-String -Path features\trips -Pattern "lib/api/places" -Recurse   # Expected: no matches
Select-String -Path app\trips\[id]\page.tsx -Pattern "sendJson|useMutation"   # Expected: no matches
Select-String -Path package.json -Pattern "@playwright/test"   # Expected: no matches
# Playwright MCP last: see StepF6.md Step 6.1 VALIDATION (navigate /trips/{id} → picker → add → duplicate → reorder/remove; guest cannot mutate)

# Full F6 checklist: see StepF6.md "F6 ship checklist"
```

Next (separate planning pass): expand [`../StepF7.md`](../StepF7.md) from outline into full prompts, then run F7 batches.
