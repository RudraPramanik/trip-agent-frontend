# Wandr — F3 Cursor prompts: Compose + planner SSE

> Blueprint: [`docs/blueprint.md`](../blueprint.md) — Phase F3 (~2.5–3.5 days · compose + SSE + clarification)
> Wire contract: [`docs/frontendGuide.md`](../frontendGuide.md) §7 SSE, §8 planner, §14 `PlanRequest`
> Guardrails: [`AGENTS.md`](../../AGENTS.md) — principle #16 Modular by default; Streaming hard rules
> Built-so-far: [`docs/app/system.md`](../app/system.md) (F2 as-built)
> Runner: [`README.md`](README.md)
>
> One prompt per sub-step. Paste **one** fence into Agent mode, or run a batch file under [`batches/`](batches/).
> Do not start the next prompt until the current validation passes.

**Run order is numeric:** **3.1 → 3.2 → 3.3**. F3.2 is the dangerous slice — its own prompt and its own session.

| Batch | File | Sub-steps |
|-------|------|-----------|
| F3a | [`batches/F3a.md`](batches/F3a.md) | 3.1 |
| F3b | [`batches/F3b.md`](batches/F3b.md) | 3.2 |
| F3c | [`batches/F3c.md`](batches/F3c.md) | 3.3 |

---

## How to use these prompts

1. Workspace root is this repo (`guideagent-frontend`). It **is** the Next.js app.
2. Read `node_modules/next/dist/docs/` before writing App Router code (this Next line has breaking changes vs training data).
3. Run one batch **or** paste one fence — not this whole file.
4. Validation is PowerShell-first.
5. If the agent adds extra packages, uses `EventSource`, routes SSE through `sendJson`, skips abort-integrity, or starts the next sub-step: stop and correct.

## Prerequisites (F2 must be complete)

- F2 ship checklist in [`StepF2.md`](StepF2.md) is green (search, readiness, Generate enabled at every tier and MUST NOT POST generate).
- `lib/sse/planner.ts`, `lib/api/planner.ts`, and `features/planner/index.ts` are still stubs (`export {}`).
- RHF / Zod / `@hookform/resolvers` are already in `package.json` (installed at 2.1). Do **not** reinstall them.
- F3a needs the sibling API at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) and a selectable destination (or a known uuid in `?destination=`).
- F3b abort-integrity proof needs that API’s server logs (background task cancel / `request.is_disconnected()`).

## Prompt conventions (every step)

- First line of every prompt: read `AGENTS.md` and the F3 locks below.
- **Extend, don't replace** F2 code unless the step says replace (readiness Generate becomes a `Link`; do not rip out search).
- **Packages at point of use** — 3.1 and 3.2 install **none**. 3.3 installs `zustand` **once**.
- **PowerShell-first** validation (`Select-String`, `Get-ChildItem`).
- **Do NOT jump ahead** to the next sub-step inside a single prompt body.
- Never invent endpoints or DTO fields. OpenAPI / `types/generated/api.d.ts` win on wire shapes; this playbook wins on sequence, layers, and proofs.

## F3 architecture

```
lib/sse/planner.ts                 POST fetch + ReadableStream `event:`/`data:` parser (3.2)
                                   AbortController passed into fetch (not just breaking the reader)
                                   GENERATE_PATH = "/api/v1/planner/generate" satisfies keyof paths
                                   body: generated PlanRequest; credentials: "include"
                                   detect non-SSE 409 JSON before parsing frames
                                   MUST NOT use getJson / sendJson (20s timeout + JSON parse)
                                   buildClarificationRawInput (3.3)

lib/api/planner.ts                 stays `export {}` in F3 — generate is SSE, not an envelope call

features/planner/compose-form.tsx  RHF + Zod; destination_id from URL; raw_input min 1 (3.1)
features/planner/use-planner-generate.ts
                                   owns AbortController; no auto-retry; abort on unmount (3.2)
features/planner/progress-panel.tsx   phase/tool status; cache hit OK without tool_* (3.3)
features/planner/clarification-form.tsx inline, not a blocking modal (3.3)
features/planner/index.ts          public barrel only

app/generate/page.tsx              Server Component mounts planner barrel
                                   may pass destination from searchParams (Promise in this Next line)
                                   no getJson / useQuery / fetch / EventSource

app/trips/[id]/page.tsx            stub only (3.3): “Trip detail lands in F4”
                                   no GET /trips/{id} in F3

store/narrative.ts                 (3.3) thin Zustand Option A keyed by trip_id

features/destinations/readiness-card.tsx
                                   Generate becomes Link to `/generate?destination=<id>` (3.1)
                                   MUST NOT import lib/sse/planner or POST generate

features/auth/session-header.tsx   unchanged — still no planner / destinations HTTP
```

Principle #16: SSE/HTTP in `lib/`; hooks/UI in `features/planner/`; `app/` only mounts barrels. Destinations does not import planner SSE. Planner does not import `lib/api/destinations`. Invalidating `["destinations","readiness", id]` by **key tuple** from the planner hook is allowed.

## Locked decisions

### Modular layers — LOCKED

- SSE stays in `lib/sse/planner.ts`. Planner UI/hooks stay in `features/planner/`. Do **not** put progress UI in `components/generate/` (blueprint folder tree is illustrative; principle #16 wins).
- `app/generate/page.tsx` and `app/page.tsx` only mount public barrels. They MUST NOT call `fetch` / `getJson` / `sendJson` / `useQuery` / `EventSource`.
- Features MUST NOT import each other’s HTTP modules. Home stays destinations; `/generate` stays planner; header stays auth chrome.
- Wire types from `types/generated/api.d.ts` (`PlanRequest`, path key). Do not hand-mirror `frontendGuide.md` §14. Do **not** invent `ClarificationNeededOut` in `types/generated/`.
- `lib/api/planner.ts` stays a stub for all of F3. Generate is not an `ApiResponse` JSON call.

### Compose on `/generate` — LOCKED (implement in 3.1)

- Home Generate CTA becomes a `Link` (or equivalent) to `/generate?destination=<uuid>`. Guests can compose. No login wall. Do not wrap `/generate` in required-auth.
- `destination_id` comes from the URL query F2 already writes. Missing id → prompt to pick a destination (link back to `/`); no fetch.
- Zod schema **mirrors** generated `PlanRequest`: `destination_id`, `raw_input` (min 1), optional `days`, `base_lat` / `base_lng`, `accommodation_label`.
- Invalid client → visible field errors, **no** fetch. 3.1 submit MUST NOT call `/planner/generate`.
- Do not put compose in `session-header.tsx`. Do not use Zustand for form fields (RHF is enough).

### Abortable SSE — LOCKED (implement in 3.2)

- `POST {API}/api/v1/planner/generate` with `credentials: "include"`, `Accept: text/event-stream`, JSON body.
- Pass a **caller-owned** `AbortController.signal` into `fetch`. Abort on unmount, route change, and explicit Cancel. Stopping the reader without aborting fetch is a **fail**.
- Parse `event:` / `data:` frames. Ignore unknown event names (dev log OK). Parser MUST NOT require `tool_*` (cache replay may omit them).
- **No** `EventSource`. **No** auto-retry of a full generate.
- **No** `getJson` / `sendJson` for this POST. The JSON gateway applies a **20s** timeout and JSON-parses the body — that would kill a minutes-long stream. Reuse `parseErrorResponse` / `ApiError` / `NetworkError` for pre-stream JSON errors only.
- Pre-stream HTTP **409** `destination_not_ready`: read JSON `ErrorResponse`, **do not** parse as SSE. UI: message + way back to `/?destination=` (readiness). Not a stream `error` event.
- Other pre-stream failures (401/422/429/5xx/network): typed errors; existing toast + panel. 429 / `rate_limit_exceeded`: toast + brief submit disable (~2s). Live limiter is **10/min**.
- Do not apply the gateway’s 20s `AbortSignal.timeout` to this fetch. Abort is user/unmount (plus whatever the server enforces).
- Commit parser-facing SSE **fixtures** under `lib/sse/fixtures/` (plain text frames). Do **not** install Vitest (F7) or `motion`.
- **End-to-end abort proof (required):** start a generate, Cancel or navigate away, confirm **server** logs show the background task canceled within a few seconds. Client-only “reader stopped” is not enough.

### Progress, terminals, clarification — LOCKED (implement in 3.3)

| Terminal | UI |
|----------|----|
| `itinerary_done` | Cache narrative Option A if present; navigate `/trips/{trip_id}` **only** when `trip_id` is a non-empty string. Missing `trip_id` → error panel, no navigation. |
| `error` (incl. `generation_timeout` / `graph_recursion_limit`) | Terminal error panel; user re-submits. No auto-retry. |
| `clarification_needed` | Terminal, **not** an error. Inline question (not a page-blocking modal); original `raw_input` stays visible. |

- Progress: show `preferences_done`, `phase_changed`, `tool_*`, `validation_done` when present. Cache hit without `tool_*` is OK (UI may jump toward done).
- Clarification answer: `raw_input = originalRawInput + "\n" + answerText` via `buildClarificationRawInput`. **Fresh** POST, **new** `AbortController`, reset progress to zero. There is no resume endpoint.
- Clarification `data` is not a generated schema. Parse JSON; prefer a `question` string if present; otherwise a conservative string from known keys.
- Install **`zustand` once** for `store/narrative.ts` keyed by `trip_id`. Hard reload may drop prose. Do not invent a narrative API. Do not add `react-markdown` (F4).
- `app/trips/[id]/page.tsx` is a stub so navigate does not 404. Do **not** `GET /trips/{id}` in F3.
- Do not treat the SSE itinerary blob as the long-term UI model.

### Packages — LOCKED

| Step | Install | Do not |
|------|---------|--------|
| 3.1 | none (RHF/Zod already from 2.1) | axios, NextAuth, EventSource polyfill |
| 3.2 | none | `motion`, Vitest, Vercel AI SDK |
| 3.3 | `zustand` | `react-markdown`, MapLibre, Playwright |

### Forward locks (do not implement in F3)

- `GET /trips/{id}` / GeoJSON / MapLibre / `react-markdown` (F4)
- Claim / trip list (F5)
- Day edit (F6)
- Vitest, Playwright (F7) — fixtures exist in 3.2; tests run in F7
- `FRONTEND_URL` OAuth bounce (backend follow-up)
- Filling `lib/api/planner.ts` with envelope JSON generate
- Required-auth on `/generate`

## Failure-mode table — LOCKED (F3)

| Failure | Response this phase must implement | Lands in |
|---------|-------------------------------------|----------|
| Invalid compose (`raw_input` empty / bad `destination_id`) | Visible field errors; **no** POST | 3.1 |
| Missing `?destination=` on `/generate` | Pick-a-destination copy + link to `/`; no fetch | 3.1 |
| 409 `destination_not_ready` | JSON error panel; **not** SSE parse; link back to readiness | 3.2 |
| 429 / `rate_limit_exceeded` | Existing toast + brief submit disable (~2s); no auto-retry | 3.2 |
| Unmount / Cancel mid-stream | Abort the **fetch** (server task cancels); not reader-only | 3.2 |
| Pre-stream 401/422/5xx / network | Typed error toast + panel | 3.2 |
| SSE `error` / `generation_timeout` / `graph_recursion_limit` | Terminal error panel; user re-submits | 3.3 |
| `clarification_needed` | Inline Q; fresh POST with appended `raw_input`; reset progress | 3.3 |
| `itinerary_done` without `trip_id` | Error panel; do not navigate | 3.3 |
| Cache hit (no `tool_*`) | Progress may jump; not an error | 3.3 |

## Feature buildup

| After | Exists | Still empty / forbidden |
|-------|--------|-------------------------|
| 3.1 | Compose form on `/generate`; Zod vs `PlanRequest`; Generate is a `Link`; invalid → no fetch | No SSE; no `fetch` to `/planner/generate`; no Zustand |
| 3.2 | `lib/sse/planner.ts`; AbortController in `fetch`; 409 panel; Cancel; fixtures | No EventSource; no `sendJson` for generate; no progress/clarification UI; no Vitest/motion |
| 3.3 | Progress + terminals; clarification helper + fresh POST; Zustand narrative; stub `/trips/[id]` | No `GET /trips/{id}`; no stream resume; `lib/api/planner.ts` still stub |

## LLD / FE patterns this phase

| Pattern | Where |
|---------|--------|
| Abortable Stream | `lib/sse/planner.ts` |
| Domain modules | `lib/api/planner.ts` stays stub; SSE is not envelope JSON |
| Feature folders + Modular layers | `features/planner/*`; `app/generate/page.tsx` mounts barrel |
| Null / empty UI | missing destination; 409 gate; missing `trip_id`; clarification inline |
| Thin Zustand | `store/narrative.ts` Option A (3.3 only) |

## Recommended run batches

| Batch | Sub-steps | Proof before next |
|-------|-----------|-------------------|
| F3a | 3.1 | `/generate?destination=` shows the form; empty `raw_input` → no POST; home Generate is a Link; no EventSource |
| F3b | 3.2 | Submit starts SSE (or 409 JSON); Cancel/navigate aborts **server** task; no `EventSource` / `sendJson` |
| F3c | 3.3 | Progress updates; clarification → new POST with `\n`; navigate only with `trip_id`; stub trip page |

---

## Step 3.1 — Compose `PlanRequest`

```
Read AGENTS.md, docs/app/system.md, docs/steps/StepF3.md (locks + this step), docs/frontendGuide.md §8 planner / §14 PlanRequest, docs/blueprint.md principle #16, and node_modules/next/dist/docs/ before writing any file.

TASK: Add a compose form on /generate that builds PlanRequest from ?destination= + user input. Wire home Generate as a Link. Invalid client → no fetch. Do not start SSE.

This is step 3.1. Do NOT add lib/sse/planner.ts logic, EventSource, Zustand, or POST /planner/generate.

─── FEATURE BUILDUP ───
After this step:
  EXISTS: features/planner/compose-form.tsx; app/generate/page.tsx mounts the planner barrel; Zod schema mirroring generated PlanRequest; destination_id from URL; Generate on readiness-card is a Link to /generate?destination=; missing destination → pick-a-destination UI.
  STILL EMPTY: generatePlanner; usePlannerGenerate; progress-panel; clarification-form; store/narrative.ts; no fetch to /planner/generate.

─── FAILURE MODE ───
- Missing ?destination= (or empty id): show “Pick a destination first” (or equivalent) with a Link to /. Do not POST. Do not invent a uuid.
- raw_input trimmed length < 1: visible field error; submit MUST NOT call fetch / generatePlanner.
- Optional days / base_lat / base_lng / accommodation_label: omit or send null per generated PlanRequest; do not invent extra fields.
- Guests can open /generate. Do not add a login wall or required-auth layout.
- Home Generate click MUST NOT POST /planner/generate — it only navigates.

─── LLD / BEST PRACTICE ───
Pattern: Feature folders + Modular layers (principle #16).
Reuse react-hook-form + zod + @hookform/resolvers already in package.json. Do not npm install anything.
Type the payload against components["schemas"]["PlanRequest"] from types/generated/api.d.ts. Zod mirrors that schema; frontendGuide.md §14 is not a second source of truth.
Check node_modules/next/dist/docs/ for searchParams on app/generate/page.tsx in this Next line (it may be a Promise, same as app/page.tsx). Page may pass destinationId into the compose component; page still MUST NOT call getJson, useQuery, or fetch.
Do not put compose in session-header. Do not use Zustand for form state.

─── WHAT TO CREATE ───

1. features/planner/compose-form.tsx ("use client"):
   - RHF + Zod. Fields: raw_input (required, min 1), optional days, base_lat, base_lng, accommodation_label.
   - destination_id from props (URL). Hidden or read-only display is fine; user must not have to re-type the uuid.
   - Label controls for a11y. Submit button exists but onSubmit MUST NOT fetch (3.2 will wire it). Helper text may say generate starts next.
   - If destinationId is empty: pick-a-destination copy + Link to "/" instead of the form.

2. features/planner/index.ts — barrel: export the page-facing compose component (e.g. PlannerCompose wrapping the form). Do not export a kitchen-sink object.

3. app/generate/page.tsx — Server Component. Await searchParams, pass destination id. Mount the planner barrel only. MUST NOT import getJson, sendJson, fetch, useQuery, or EventSource.

4. features/destinations/readiness-card.tsx — change the Generate control to a Link (or Button asChild + Link) to `/generate?destination=${id}` when a destination id is present. Keep it enabled for ready / limited / sparse. MUST NOT import lib/sse/planner or call POST /planner/generate. MUST NOT import lib/api/planner.

5. Leave lib/sse/planner.ts, lib/api/planner.ts, and session-header unchanged.

─── RULES FOR THIS STEP ───
- Do NOT jump ahead to step 3.2 (no SSE, no AbortController generate client).
- Do NOT install packages.
- Do NOT add Zustand.
- Do NOT wrap /generate in required-auth.
- Do NOT put fetch / getJson / useQuery in app/generate/page.tsx or session-header.

─── VALIDATION ───
  Test-Path app\generate\page.tsx
  Test-Path features\planner\compose-form.tsx
  Select-String -Path features\planner -Pattern "planner/generate|EventSource|getJson|sendJson" -Recurse   # Expected: no matches
  Select-String -Path app\generate\page.tsx -Pattern "getJson|useQuery|sendJson|EventSource|fetch"   # Expected: no matches
  Select-String -Path features\destinations\readiness-card.tsx -Pattern "/generate"
  Select-String -Path features\destinations\readiness-card.tsx -Pattern "planner/generate"   # Expected: no matches
  Select-String -Path lib\sse\planner.ts -Pattern "export \{\}"
  Select-String -Path package.json -Pattern '"zustand"|"motion"|"vitest"'   # Expected: no matches
  Select-String -Path app\page.tsx -Pattern "getJson|useQuery"   # Expected: no matches

  npm run dev
  # Browser: home, select a destination, Generate → /generate?destination=<uuid> with a form.
  # Submit with empty raw_input → validation error; Network has no POST .../planner/generate.
  # Open /generate with no query → pick-a-destination, no crash.
  # Sparse destination: Generate link still works (warn-and-allow unchanged).
```

---

## Step 3.2 — Abortable SSE client

```
Read AGENTS.md, docs/app/system.md, docs/steps/StepF3.md (locks + this step), docs/frontendGuide.md §7 SSE, docs/blueprint.md F3.2 (abort-integrity), and node_modules/next/dist/docs/ before writing any file.

TASK: Implement POST /planner/generate as fetch + ReadableStream with a real AbortController in fetch. Handle 409 before SSE. Wire compose submit to a crude generating/cancel surface so abort can be proved. Fixtures on disk. No EventSource. No sendJson.

This is step 3.2. Last chance to get abort right. Do NOT add progress-panel, clarification-form, Zustand, trip stub, or Vitest/motion.

─── FEATURE BUILDUP ───
After this step:
  EXISTS: lib/sse/planner.ts generate client; parseSseFrames (or equivalent pure parser); lib/sse/fixtures/*.txt (or .sse); usePlannerGenerate with AbortController; compose submit starts the stream; Cancel + unmount abort fetch; 409 destination_not_ready panel with link to /?destination=.
  STILL EMPTY: progress-panel; clarification-form; store/narrative.ts; app/trips/[id]; no EventSource; lib/api/planner.ts still stub.

─── FAILURE MODE ───
- 409 destination_not_ready: parse JSON ErrorResponse (parseErrorResponse / ApiError). Do NOT parse the body as SSE. Show the API message + Link back to /?destination=<id>.
- 429 / rate_limit_exceeded: existing toast + brief disable of submit (~2s). Do not auto-retry the generate.
- Other pre-stream non-OK: typed ApiError / NetworkError; toast + panel. Do not hang on a spinner.
- Unmount, route change, or Cancel: controller.abort() must run so fetch is aborted. Breaking the reader loop alone is a fail.
- Network / CORS: NetworkError; no fake itinerary.
- Do not apply AbortSignal.timeout(20_000) from the JSON gateway. Generate may run longer than 20s.

─── LLD / BEST PRACTICE ───
Pattern: Abortable Stream + Modular layers.
GENERATE_PATH = "/api/v1/planner/generate" satisfies keyof paths.
POST via fetch to getPublicApiUrl() + path. credentials: "include". Accept: text/event-stream. content-type: application/json. body: JSON.stringify(PlanRequest).
signal: the AbortController the hook owns — pass it into fetch(... { signal }).
If !res.ok: await res.text(), JSON.parse, parseErrorResponse from lib/api/client.ts, throw ApiError. Especially 409 code destination_not_ready.
If ok: read res.body as ReadableStream, decode text, split SSE frames (event: / data:). Yield progress events; stop at the first terminal (itinerary_done | error | clarification_needed). Ignore unknown event names.
MUST NOT import EventSource. MUST NOT call getJson or sendJson (they JSON-parse and 20s-timeout).
Hook: "use client"; create AbortController per generate; abort previous on new submit; abort in useEffect cleanup; retry: none; no automatic second POST.
Invalidate ["destinations","readiness", id] by key tuple when starting generate is allowed. Do not import lib/api/destinations.
Crude UI is enough: “Generating…”, Cancel button, 409 panel, generic error. Phase/tool list is 3.3.
Commit at least: a progress+itinerary_done fixture, a clarification_needed fixture, an error fixture, and a cache-hit fixture that omits tool_* events.

─── WHAT TO CREATE ───

1. lib/sse/planner.ts — replace the F3 stub:
   - generatePlanner(request: PlanRequest, signal: AbortSignal): AsyncIterable or callback/stream of { event, data }
   - parseSseChunk/parseSseFrames as a pure function the fixtures can feed later (F7 Vitest)
   - Pre-stream error mapping as above
   - Do not use sendJson / getJson

2. lib/sse/fixtures/ — plain-text SSE samples (names like itinerary-done.sse, clarification.sse, error.sse, cache-hit.sse). Not executed in this step.

3. features/planner/use-planner-generate.ts ("use client"):
   - Owns AbortController
   - start(request) / cancel()
   - abort on unmount
   - Surface 409 vs other errors vs streaming vs idle
   - No auto-retry

4. features/planner/compose-form.tsx — on valid submit, call start(planRequest). While streaming: show Generating + Cancel (calls cancel()). On 409: panel + Link to /?destination=. Do not implement clarification UI.

5. features/planner/index.ts — also export the hook if useful. Page still mounts compose only.

6. Leave lib/api/planner.ts as export {}. Leave app/generate/page.tsx free of fetch.

─── RULES FOR THIS STEP ───
- Do NOT jump ahead to step 3.3 (no progress-panel, no clarification-form, no Zustand, no /trips/[id]).
- Do NOT install packages.
- Do NOT use EventSource.
- Do NOT use sendJson / getJson for generate.
- Do NOT auto-retry generate.
- Do NOT add a 20s client timeout on this fetch.

─── VALIDATION ───
  Select-String -Path lib\sse\planner.ts -Pattern "planner/generate"
  Select-String -Path lib\sse\planner.ts -Pattern "EventSource|sendJson|getJson"   # Expected: no matches
  Select-String -Path lib\sse\planner.ts -Pattern "AbortController|signal"
  Select-String -Path features\planner -Pattern "EventSource" -Recurse   # Expected: no matches
  Select-String -Path app\generate\page.tsx -Pattern "getJson|sendJson|EventSource|fetch"   # Expected: no matches
  Select-String -Path lib\api\planner.ts -Pattern "export \{\}"
  Test-Path lib\sse\fixtures
  Get-ChildItem lib\sse\fixtures
  Select-String -Path package.json -Pattern '"zustand"|"motion"|"vitest"'   # Expected: no matches
  Select-String -Path features\destinations -Pattern "planner/generate" -Recurse   # Expected: no matches

  npm run dev
  # Browser: valid compose submit → POST {API}/api/v1/planner/generate (SSE or 409 JSON).
  # Empty raw_input still does not POST (3.1).
  # 409: no SSE frame parse; message + link home; Network shows 409 not a hanging stream reader.
  # Cancel or navigate away mid-stream: fetch aborted (Network status canceled).

  # REQUIRED abort-integrity (manual, local API logs — F3b is not green without this):
  # Start a generate, Cancel or leave /generate, then confirm API logs show the background
  # task canceled within a few seconds (request.is_disconnected / task cancelled).
  # A client-only "the reader stopped" check is NOT sufficient.
```

---

## Step 3.3 — Progress UI + terminals + clarification

```
Read AGENTS.md, docs/app/system.md, docs/steps/StepF3.md (locks + this step), docs/frontendGuide.md §7 terminals, docs/blueprint.md F3.3 (clarification re-submission), and node_modules/next/dist/docs/ before writing any file.

TASK: Show planner progress and handle terminals. itinerary_done navigates only with trip_id. clarification_needed is not an error — answer starts a fresh POST. Narrative Option A in Zustand. Stub trip page. Last F3 code step.

This is step 3.3. Do NOT start F4 (no GET /trips/{id}, no MapLibre, no react-markdown). Do not add Vitest.

─── FEATURE BUILDUP ───
After this step:
  EXISTS: progress-panel; clarification-form; buildClarificationRawInput; store/narrative.ts; app/trips/[id]/page.tsx stub; navigate on itinerary_done with trip_id; fresh generate on clarification; zustand in package.json.
  STILL EMPTY: GET /trips/{id}; GeoJSON; map; react-markdown; lib/api/planner.ts still stub; no stream resume client.

─── FAILURE MODE ───
- Cache hit with no tool_* events: progress may jump; do not show an error or spinner forever.
- itinerary_done without trip_id: error panel (“No trip id” or equivalent). MUST NOT router.push("/trips/undefined").
- SSE error / generation_timeout / graph_recursion_limit: terminal error panel; user must click generate again. No auto-retry.
- clarification_needed: inline question, original raw_input still visible. NOT a toast-as-error. NOT a page-blocking modal.
- Clarification submit: raw_input = buildClarificationRawInput(original, answer) which MUST be original + "\n" + answer. New AbortController. Reset progress to empty/zero. Do not call a resume URL.
- Hard reload after generate: narrative cache may be empty — OK. Do not invent a narrative API.
- Missing destination on /generate still behaves as 3.1.

─── LLD / BEST PRACTICE ───
Pattern: Abortable Stream + Null / empty UI + thin Zustand.
Progress panel reads events already surfaced by usePlannerGenerate (preferences_done, phase_changed, tool_started, tool_done, tool_batch_done, validation_done). Unknown events ignored.
On itinerary_done: if payload has day title/narrative, write store/narrative.ts keyed by trip_id (Option A). Then navigate `/trips/${trip_id}` only if trip_id is a non-empty string. Do not GET /trips/{id}. Do not keep the SSE blob as the trip model.
buildClarificationRawInput(original: string, answer: string): string — export from lib/sse/planner.ts (or a tiny sibling) so F7 can unit-test it. Clarification data JSON: prefer data.question if it is a string; else a conservative fallback from known keys. Do not edit types/generated/api.d.ts.
npm install zustand — once. store/narrative.ts is the only store. Do not put compose fields in Zustand.
app/trips/[id]/page.tsx: Server Component stub. Copy like “Trip detail lands in F4.” No trips HTTP.
Keep abort-on-unmount from 3.2. Fresh clarification generate must abort the previous controller before starting the new fetch.

─── WHAT TO CREATE ───

1. features/planner/progress-panel.tsx — list/status for progress events; idle/empty OK. aria-live polite for status text.

2. features/planner/clarification-form.tsx — inline; shows question; answer field; submit calls start() with rebuilt PlanRequest (same destination_id / optional fields, new raw_input). Original input remains visible on the page (compose form still mounted or a read-only copy).

3. lib/sse/planner.ts — add buildClarificationRawInput(original, answer) => `${original}\n${answer}` (preserve original exactly; do not trim away the user’s text).

4. store/narrative.ts — zustand store: setNarrative(tripId, payload), get by tripId. Cache day title/narrative if present on itinerary_done. Comment that hard reload may lose it.

5. app/trips/[id]/page.tsx — stub only. Do not import lib/api/trips.

6. Wire terminals in the generate feature (compose + hook + panels): itinerary_done → cache + navigate; error → panel; clarification_needed → clarification form + reset progress on resubmit.

7. features/planner/index.ts — export progress/clarification as needed. app/generate/page.tsx still mounts barrels only.

8. package.json — zustand added at this step only.

─── RULES FOR THIS STEP ───
- Do NOT implement GET /trips/{id}, map, or react-markdown.
- Do NOT invent a resume endpoint or EventSource.
- Do NOT disable Generate on sparse (that is F2; leave it).
- Do NOT fill lib/api/planner.ts.
- Do NOT jump ahead to F4.
- Do NOT install motion, Vitest, MapLibre, or react-markdown.

─── VALIDATION ───
  Test-Path features\planner\progress-panel.tsx
  Test-Path features\planner\clarification-form.tsx
  Test-Path store\narrative.ts
  Test-Path app\trips\[id]\page.tsx
  Select-String -Path lib\sse\planner.ts -Pattern "buildClarificationRawInput"
  Select-String -Path features\planner -Pattern "EventSource|resume" -Recurse   # Expected: no matches (no resume client)
  Select-String -Path app\generate\page.tsx -Pattern "getJson|sendJson|EventSource|fetch"   # Expected: no matches
  Select-String -Path app\trips\[id]\page.tsx -Pattern "getJson|useQuery|/trips/"   # Expected: stub only — no trips HTTP client
  Select-String -Path lib\api\planner.ts -Pattern "export \{\}"
  Select-String -Path lib\api\trips.ts -Pattern "export \{\}"
  Select-String -Path package.json -Pattern '"zustand"'
  Select-String -Path package.json -Pattern '"motion"|"vitest"|"react-markdown"|"maplibre"'   # Expected: no matches
  Select-String -Path features\destinations -Pattern "planner/generate" -Recurse   # Expected: no matches
  Select-String -Path app\page.tsx -Pattern "getJson|useQuery"   # Expected: no matches

  npm run dev
  # Browser: generate shows phase/tool (or jumps on cache hit).
  # itinerary_done with trip_id → /trips/{id} stub page (not a 404).
  # itinerary_done without trip_id (if you can fixture it) → error panel, stay on /generate.
  # clarification_needed → inline question; submit → NEW POST with raw_input containing a newline; progress resets.
  # Network: no EventSource; no GET /api/v1/trips/{id} yet.
```

---

## F3 ship checklist

Do not author full F4 prompts or start F4 code until every item is green:

```
# 3.1
Test-Path app\generate\page.tsx
Test-Path features\planner\compose-form.tsx
Select-String -Path features\destinations\readiness-card.tsx -Pattern "/generate"
Select-String -Path features\planner -Pattern "EventSource" -Recurse   # Expected: no matches
# Browser: Generate from home is a Link; empty raw_input → no POST

# 3.2
Select-String -Path lib\sse\planner.ts -Pattern "planner/generate"
Select-String -Path lib\sse\planner.ts -Pattern "EventSource|sendJson|getJson"   # Expected: no matches
Test-Path lib\sse\fixtures
# Browser: submit → SSE or 409 JSON (409 is not parsed as SSE)
# REQUIRED: Cancel/navigate → API logs show background task canceled (not client-only abort)

# 3.3
Select-String -Path lib\sse\planner.ts -Pattern "buildClarificationRawInput"
Test-Path store\narrative.ts
Test-Path app\trips\[id]\page.tsx
Select-String -Path package.json -Pattern '"zustand"'
# Browser: clarification answer → fresh POST with newline; navigate only with trip_id

# Guard
Select-String -Path app\generate\page.tsx -Pattern "getJson|useQuery|sendJson|EventSource|fetch"
# Expected: no matches (page mounts barrels only)
Select-String -Path app\page.tsx -Pattern "getJson|useQuery"
# Expected: no matches
Select-String -Path lib\api\planner.ts -Pattern "export \{\}"
Select-String -Path features\destinations -Pattern "planner/generate" -Recurse   # Expected: no matches
Test-Path AGENT.md   # Expected: False
```

All checks passing → F3 is done. Next: expand [`StepF4.md`](StepF4.md) from outline into full prompts, then run F4 batches. Do not implement F4 until that expansion exists.
