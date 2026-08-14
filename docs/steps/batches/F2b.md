# F2b — CLI session: readiness gate

> Run **this file** as the agent prompt (or paste it). Do not also paste all of `StepF2.md`.
> Prompt bodies live in [`../StepF2.md`](../StepF2.md). This file is the session gate.

## Prerequisites

- **F2a green** (`searchDestinations`, `useDestinationSearch`, search on `/`, RHF/Zod installed, header still fetch-free).
- No new packages. Generate CTA is **enabled at every tier** and MUST NOT call `POST /planner/generate`.

## Read first

1. [`../StepF2.md`](../StepF2.md) — locks (warn-and-allow, no `search_available`, modular layers, URL `?destination=`)
2. Execute the fenced prompt in `StepF2.md`:
   - **Step 2.2** — Readiness gate

## Session rules

- Add `getDestinationReadiness` next to `searchDestinations`. Query key `["destinations","readiness", id]`.
- `limited` / `sparse`: generate still enabled; `sparse` warning more prominent. Never hard-block.
- 404 → not-found panel. Do not invent `search_available`.
- `app/page.tsx` mounts barrels only (may pass `destination` from `searchParams`). No `getJson` / `useQuery` on the page.
- Do not wrap routes in required-auth. Do not start F3 (no compose form, no SSE).

## Hard stop

When 2.2 validation passes, run the **F2 ship checklist** at the bottom of `StepF2.md`. Then **stop**. Do not expand or implement F3 in this session.

## Proofs (F2 ship)

```powershell
Select-String -Path lib\api\destinations.ts -Pattern "readiness"
Select-String -Path features\destinations -Pattern "search_available" -Recurse   # Expected: no matches
Select-String -Path features\destinations\readiness-card.tsx -Pattern "planner/generate"   # Expected: no matches
Select-String -Path app\page.tsx -Pattern "getJson|useQuery|planner/generate"   # Expected: no matches
Select-String -Path features\auth\session-header.tsx -Pattern "getDestinationReadiness|destinations/search"   # Expected: no matches
# Browser: select a result → ?destination= + tier/message; Generate enabled on sparse; no planner POST

# Full F2 checklist: see StepF2.md "F2 ship checklist"
```

Next (separate planning pass): expand [`../StepF3.md`](../StepF3.md) from outline into full prompts, then run F3 batches.
