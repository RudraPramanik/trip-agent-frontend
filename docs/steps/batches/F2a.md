# F2a — CLI session: destination search

> Run **this file** as the agent prompt (or paste it). Do not also paste all of `StepF2.md`.
> Prompt bodies live in [`../StepF2.md`](../StepF2.md). This file is the session gate.

## Prerequisites

- **F1 ship checklist green** (cookie probe, login/logout, `SessionHeader`, Search placeholder as a `Link` to `/`).
- Local API up at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) with `GET /api/v1/destinations/search?q=Da` reachable.
- `lib/api/destinations.ts` is still a stub. Install **only** `react-hook-form`, `zod`, `@hookform/resolvers`. **Do not** add axios, a debounce package, NextAuth, or planner SSE.

## Read first

1. [`../../app/system.md`](../../app/system.md) — F1 as-built (destinations still stubs; header Search is a Link)
2. [`../StepF2.md`](../StepF2.md) — **Locked decisions**, **Failure-mode table**, **Feature buildup**, **Modular layers**
3. Then execute the fenced prompt in `StepF2.md`:
   - **Step 2.1** — Destination search

## Session rules

- HTTP only in `lib/api/destinations.ts` (`searchDestinations` only). Hooks and UI in `features/destinations/`.
- Home (`app/page.tsx`) mounts the destinations barrel. It must not call `getJson` / `useQuery`.
- Header Search stays a `Link` to `/` (or `/#destination-search`). Do not put typeahead in `session-header.tsx`.
- `q` min 2; debounce ~300ms; empty list → empty UI; 429 → existing toast + brief disable.
- Do **not** start 2.2 (no readiness, no generate CTA).
- Do **not** call `POST /planner/generate` or add Zustand.

## Hard stop

When 2.1 validation passes, **stop**. Do not continue into F2b.

## Proofs (must be green before F2b)

```powershell
Select-String -Path lib\api\destinations.ts -Pattern "destinations/search"
Select-String -Path lib\api\destinations.ts -Pattern "readiness"   # Expected: no matches yet
Select-String -Path features\destinations -Pattern 'destinations","search"|destinations", "search"' -Recurse
Select-String -Path package.json -Pattern "react-hook-form"
Select-String -Path features\auth\session-header.tsx -Pattern "searchDestinations|getJson"   # Expected: no matches
Select-String -Path app\page.tsx -Pattern "getJson|useQuery|searchDestinations"   # Expected: no matches
# Browser: http://localhost:3000 search field on home; 1 char → no request; "Da" → results or empty
```
