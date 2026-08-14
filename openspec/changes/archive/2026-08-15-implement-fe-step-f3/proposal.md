## Why

F2 shipped home search, `?destination=` selection, and warn-and-allow readiness, but Generate is still a no-op button and planner modules are stubs. Guests cannot compose a `PlanRequest` or start abortable SSE generate. Implement F3 now so compose lives on `/generate`, the stream is a real `AbortController` in `fetch` (not `EventSource` / `sendJson`), and `clarification_needed` is a fresh POST — not a resume.

F3a (3.1 compose), F3b (3.2 abortable SSE), and F3c (3.3 progress / terminals / clarification) land in **one** OpenSpec change — the same grain as `implement-fe-step-f1` and `implement-fe-step-f2`. They share one SSE client, one planner feature folder, and one `/generate` page. Apply stays three hard-stopped batches: prove compose-without-POST before SSE; prove abort-integrity before progress UI. Do not merge 3.1–3.3 into a single prompt body.

## What Changes

- Add compose on `/generate?destination=<uuid>`: RHF + Zod mirroring generated `PlanRequest` (`destination_id` from URL, `raw_input` min 1, optional `days` / `base_lat` / `base_lng` / `accommodation_label`). Invalid client → visible errors and **no** fetch. Missing destination → pick-a-destination UI, no invented uuid. Guests can compose; no login wall.
- Change home Generate from a no-op button to a `Link` to `/generate?destination=<id>` (enabled at every readiness tier). Destinations MUST NOT import planner SSE or POST generate.
- Fill `lib/sse/planner.ts` as POST `fetch` + `ReadableStream` `event:`/`data:` parser with a caller-owned `AbortController` passed into `fetch`. `GENERATE_PATH = "/api/v1/planner/generate" satisfies keyof paths`. Credentials include. Detect pre-stream 409 `destination_not_ready` as JSON, not SSE. MUST NOT use `getJson` / `sendJson` (20s timeout + JSON parse would kill the stream). MUST NOT use `EventSource`. No auto-retry. Commit SSE fixtures under `lib/sse/fixtures/`.
- Add `features/planner/use-planner-generate.ts` (owns AbortController; abort on unmount / Cancel / route change). Crude generating + Cancel in 3.2 so abort can be proved against API logs.
- Add progress panel, inline clarification (not a blocking modal), `buildClarificationRawInput` (original + newline + answer), fresh POST + new AbortController + reset progress. Terminals: `itinerary_done` navigates `/trips/{trip_id}` only when `trip_id` is a non-empty string; `error` / timeout codes → error panel; `clarification_needed` is not an error. Cache hit without `tool_*` is OK.
- Install `zustand` **once** at 3.3 for `store/narrative.ts` Option A keyed by `trip_id`. Stub `app/trips/[id]/page.tsx` so navigate does not 404. Do **not** `GET /trips/{id}` in F3.
- Leave `lib/api/planner.ts` as `export {}` for all of F3. Stop at the F3 ship checklist. Do **not** implement trip detail, MapLibre, `react-markdown`, claim, Vitest/Playwright, or `motion`.

## Capabilities

### New Capabilities

- `planner`: Guest-reachable compose of generated `PlanRequest` on `/generate`, abortable POST SSE generate (real `AbortController` in `fetch`, no `EventSource`, no JSON gateway), pre-stream 409 gate, progress + terminals, clarification as a fresh POST with appended `raw_input`, and session narrative cache Option A. Modular layers: SSE in `lib/sse/planner.ts`, hooks/UI in `features/planner/`, `app/generate/page.tsx` mounts barrels only.

### Modified Capabilities

- `destinations`: Generate CTA becomes a navigation `Link` to `/generate?destination=<id>` (still enabled at every tier, still MUST NOT POST `/planner/generate` or import planner SSE). Home remains destinations-only.

## Impact

- **Touched:** `lib/sse/planner.ts`, `lib/sse/fixtures/`, `features/planner/*`, `app/generate/page.tsx`, `app/trips/[id]/page.tsx` (stub), `store/narrative.ts`, `features/destinations/readiness-card.tsx` (Generate → Link), `package.json` / lockfile (`zustand` at 3.3), `docs/app/system.md` (F3 as-built snapshot at ship).
- **Not touched:** `lib/api/client.ts` (do not route SSE through the JSON gateway), `lib/api/planner.ts` (stays stub), `lib/api/trips.ts` (stays stub), `lib/api/destinations.ts`, FastAPI, `AGENTS.md` / `docs/blueprint.md` / `docs/frontendGuide.md` (streaming and clarification contracts already exist), Vitest/Playwright, MapLibre, `react-markdown`, `motion`.
- **APIs / deps:** `zustand` at 3.3 only. RHF/Zod already present from F2. Wire: `POST /api/v1/planner/generate` (SSE). Auth: none (guest-reachable compose). Live generate limiter is **10/min**.
- **Prerequisites (already met):** F2 ship is green (search, readiness, Generate enabled and currently no-op). `StepF3.md` + `batches/F3a.md` / `F3b.md` / `F3c.md` exist. Generated types already include `PlanRequest` and `POST /api/v1/planner/generate`. Planner SSE/feature modules are still stubs.
- **Runtime dependency:** F3a browser proofs need the sibling API and a selectable destination (or known uuid in `?destination=`). F3b needs `POST /planner/generate` (SSE or 409) and **server logs** for abort-integrity. F3c needs a generate that can reach terminals (live or fixture-driven).
- **Follow-up:** expand `docs/steps/StepF4.md` from outline after this ship checklist is green (separate change). Do not implement `GET /trips/{id}` here.
