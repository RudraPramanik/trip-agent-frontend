## Context

See `proposal.md` for why. `docs/blueprint.md` (F3) remains the product SSOT. Wire contract is `docs/frontendGuide.md` §7 SSE, §8 planner, §14 `PlanRequest`. `docs/steps/StepF3.md` is an outline; `_template.md` and `StepF2.md` are the prompt-file pattern to copy.

F2 code is on disk: home search, `?destination=`, warn-and-allow `ReadinessCard`, Generate button that does **not** `POST /planner/generate`. Stubs still `export {}`: `lib/sse/planner.ts`, `lib/api/planner.ts`, `features/planner/index.ts`. RHF/Zod already installed. `sendJson` in `lib/api/client.ts` uses a **20s** timeout and JSON-parses the body — it cannot carry a long SSE generate.

This change writes playbooks only. It does not implement compose or SSE.

## Goals / Non-Goals

**Goals:**
- Same two grains as F0–F2: one fenced prompt per sub-step in `StepF3.md`; thin `F3a` / `F3b` / `F3c` batch files that point into it.
- Lock a modular planner architecture so a later implement change cannot put `fetch` in `app/generate/page.tsx`, use `EventSource`, route SSE through `sendJson`, or “resume” a clarification stream.
- Name every F3 failure boundary the implementer must prove (invalid compose, 409 pre-stream, abort closes HTTP, terminal `error`, clarification fresh POST, missing `trip_id`, 429, cache hit without `tool_*`).
- Keep F3.2 (abortable SSE) as its **own** session — the outline’s dangerous slice.
- Point `docs/app/system.md` at F2-as-built so F3 prompts can cite readiness + non-fetching Generate.

**Non-Goals:**
- Implementing F3 application code, SSE, compose UI, or `/trips/[id]` beyond what a later implement change will do.
- Editing `docs/frontendGuide.md`, `docs/blueprint.md`, `AGENTS.md`, or the backend repo.
- Expanding `StepF4.md`–`StepF7.md` beyond their outlines.
- Installing `zustand` / `motion` / Vitest / `react-markdown` in **this** (docs) change. Later implement installs Zustand at 3.3 only.
- Inventing a narrative API, a stream-resume endpoint, or `EventSource`.

## Decisions

### 1. Two-layer files (same as F0–F2)

`StepF3.md` is the SSOT for locks, architecture, failure table, feature buildup, and one fenced prompt per sub-step. `docs/steps/batches/F3a.md`, `F3b.md`, and `F3c.md` are session gates: prerequisites, read pointers, order, hard stop, proofs. They do not duplicate prompt bodies.

**Alternative considered:** Self-contained batch files that inline prompts. Rejected — two copies drift (F0 decision 1).

### 2. Batch split: F3a → F3b → F3c

| Batch | Sub-steps | Why |
|-------|-----------|-----|
| F3a | 3.1 | Compose form + Zod vs generated `PlanRequest`. Invalid → no fetch. Generate CTA becomes a `Link` to `/generate?destination=`. No SSE. |
| F3b | 3.2 | `lib/sse/planner.ts` + real `AbortController` in `fetch`. Wire compose submit to a crude generating/cancel surface so abort can be proved. 409 before stream. Own session. |
| F3c | 3.3 | Progress + terminals + clarification loop + narrative Option A + navigate `/trips/{trip_id}` (stub page). |

Blueprint numbers stay 3.1–3.3. Run order is numeric. F3.2 stays its own prompt **and** its own batch so abort-integrity is not skipped in a compose+UI rush.

**Alternative considered:** One session for 3.2–3.3. Rejected — mixing the stream client with clarification UI is how EventSource, client-only abort, and “resume stream” sneak in.

**Alternative considered:** 3.2 library-only with no UI. Rejected — the required e2e abort proof needs a way to start and cancel a live generate.

### 3. Modular layers — LOCKED in the playbook

Prompts must name these files and forbid crossing them:

```
lib/sse/planner.ts                 POST fetch + ReadableStream `event:`/`data:` parser
                                   AbortController passed into fetch (not just breaking the reader)
                                   GENERATE_PATH = "/api/v1/planner/generate" satisfies keyof paths
                                   body: generated PlanRequest; credentials: "include"
                                   detect non-SSE 409 JSON before parsing frames
                                   MUST NOT use getJson / sendJson (20s timeout + JSON parse)

lib/api/planner.ts                 stays `export {}` in F3 — generate is SSE, not an envelope call

features/planner/compose-form.tsx  RHF + Zod; destination_id from URL; raw_input min 1
features/planner/use-planner-generate.ts
                                   owns AbortController; no auto-retry; abort on unmount
features/planner/progress-panel.tsx   (3.3) phase/tool status; cache hit OK without tool_*
features/planner/clarification-form.tsx (3.3) inline, not a blocking modal
features/planner/index.ts          public barrel only

app/generate/page.tsx              Server Component mounts planner barrel
                                   may pass destination from searchParams (Promise in this Next line)
                                   no getJson / useQuery / fetch / EventSource

app/trips/[id]/page.tsx            stub only: “Trip detail lands in F4” so navigate does not 404
                                   no GET /trips/{id} in F3

store/narrative.ts                 (3.3) thin Zustand Option A keyed by trip_id

features/destinations/readiness-card.tsx
                                   Generate becomes Link to `/generate?destination=<id>`
                                   MUST NOT import lib/sse/planner or POST generate
```

Rules the prompts must repeat:

- HTTP/SSE stays in `lib/sse/planner.ts` (and existing `lib/api/*` for JSON). Features never call `fetch` / `getJson` / `sendJson` / `EventSource`.
- Query/stream hooks and planner UI live in `features/planner/`, not `components/generate/` (blueprint tree is illustrative; principle #16 wins).
- `app/` only mounts public barrels. It does not own AbortControllers, frame parsing, or `PlanRequest` construction.
- Destinations MUST NOT import planner SSE. Planner MUST NOT import `lib/api/destinations`. Cross-feature compose is page-level + URL `?destination=`. Invalidating `["destinations","readiness", id]` by **key tuple** from the planner hook is allowed; importing destinations HTTP is not.
- Header stays fetch-free. Do not put compose in `session-header.tsx`.

**Alternative considered:** Put progress UI in `components/generate/` as the blueprint folder tree sketches. Rejected — F2 already forbade dumping feature UI into `components/`.

**Alternative considered:** `generatePlanner` in `lib/api/planner.ts` via `sendJson`. Rejected — `sendJson` JSON-parses the body and aborts at 20s; generate is a minutes-long SSE POST.

### 4. Compose lives on `/generate`; home Generate is a Link

F2 proof was “Generate enabled at every tier, no planner POST.” F3 replaces that no-op with navigation: `Link` (or equivalent) to `/generate?destination=<uuid>`. Guests can compose. No login wall.

`destination_id` is required from the URL (same query F2 wrote). Optional `days`, `base_lat`/`base_lng`, `accommodation_label`. `raw_input` min length 1. Zod schema **mirrors** generated `PlanRequest` — do not hand-copy `frontendGuide.md` §14 as a second source of truth.

Invalid client → visible field errors, **no** fetch. 3.1 submit MUST NOT call `/planner/generate` (same grain as F2’s non-fetching CTA). 3.2 wires submit.

**Alternative considered:** Compose inline on home under the readiness card. Rejected — home stays search + readiness; generate is its own route in the blueprint tree (`app/generate/`). URL still carries `destination`.

**Alternative considered:** Zustand for compose fields. Rejected — RHF is enough; Zustand is reserved for narrative Option A (and later map/wizard).

### 5. SSE client — LOCKED (3.2)

- `POST {API}/api/v1/planner/generate` with `credentials: "include"`, `Accept: text/event-stream` (and `content-type: application/json` for the body).
- Pass a **caller-owned** `AbortController.signal` into `fetch`. Abort on unmount, route change, and explicit Cancel. Stopping the reader without aborting fetch is a **fail**.
- Parse `event:` / `data:` frames. Ignore unknown event names (dev log OK).
- Progress vs terminal per `frontendGuide.md` §7. Exactly one terminal: `itinerary_done` | `error` | `clarification_needed`.
- Cache replay may omit `tool_*` — treat as normal (lock in 3.3 UI, but parser must not require those events).
- **No** `EventSource`. **No** auto-retry of a full generate.
- Pre-stream HTTP **409** `destination_not_ready`: read JSON `ErrorResponse`, **do not** parse as SSE. UI: message + way back to `/?destination=` (readiness). This is not a stream error event.
- Other pre-stream failures (401/422/429/5xx/network): typed `ApiError` / `NetworkError` using the same envelope parser as the gateway (`parseErrorResponse`), then existing toast + panel. 429 / `rate_limit_exceeded`: toast + brief submit disable (~2s). Planner live limit is **10/min**.
- Do not apply the gateway’s 20s `AbortSignal.timeout` to this fetch. Generate can run longer. Abort is user/unmount only (plus whatever the **server** enforces).
- Commit parser-facing SSE **fixtures** (plain text frames) next to the module, e.g. `lib/sse/fixtures/`. Do **not** install Vitest in F3 (package table: F7.2). F7 will run the tests. 3.2 proof is greps + manual abort-integrity against the local API.

**End-to-end abort proof (required before F3 ship, lives in 3.2 validation):** start a generate, Cancel or navigate away, confirm **server** logs show the background task canceled within a few seconds — not that it ran to completion. A client-only “reader stopped” check is not enough.

**Alternative considered:** Install Vitest at 3.2 because the blueprint F3.2 ✅ mentions Vitest. Rejected — package install order puts Vitest in F7; outline says “Vitest-later fixtures.” Fixtures + pure parse function now; tests later.

**Alternative considered:** Install `motion` at 3.2. Rejected — CSS + status text is enough; outline marks motion optional.

### 6. Progress, terminals, clarification — LOCKED (3.3)

- Progress UI shows `preferences_done`, `phase_changed`, `tool_*`, `validation_done` when present. Missing tools on cache hit: jump toward done is OK.
- `itinerary_done`: persist narrative Option A (day title/prose if present in payload) in Zustand keyed by `trip_id`; navigate to `/trips/{trip_id}` **only** if `trip_id` is a non-empty string. Missing `trip_id` → error panel, no navigation. Do not treat the SSE itinerary blob as the long-term UI model. Do **not** `GET /trips/{id}` in F3 (F4).
- `error` (incl. `generation_timeout` / `graph_recursion_limit`): terminal error panel; user must re-submit. Not an auto-retry.
- `clarification_needed`: terminal, **not** an error. Inline question (not a page-blocking modal); original `raw_input` remains visible/editable. On answer: `raw_input = originalRawInput + "\n" + answerText`, **fresh** `POST` with a **new** `AbortController`, reset progress UI to zero. No resume endpoint. Helper `buildClarificationRawInput(original, answer)` so F7 can unit-test it.
- Clarification `data` is not a generated OpenAPI schema. Parse JSON; prefer a `question` string if present; otherwise show a conservative string from known keys. Do not invent `ClarificationNeededOut` in `types/generated/`.
- Install **`zustand` once at 3.3** for `store/narrative.ts`. Hard reload may drop prose. Do not invent a narrative API. Do not add `react-markdown` (F4).
- `app/trips/[id]/page.tsx` stub so the router has a target. Copy: trip detail / map land in F4.

**Alternative considered:** Modal clarification. Rejected — blueprint: inline, user can still see original input.

**Alternative considered:** `GET /trips/{id}` immediately after `itinerary_done` in F3. Rejected — F4 owns trip detail; F3 only needs a navigable stub. Optional later implement may prefetch; playbook must not require the trips HTTP module.

### 7. Packages — LOCKED

| Step | Install | Do not |
|------|---------|--------|
| 3.1 | none (RHF/Zod already from 2.1) | axios, NextAuth, EventSource polyfill |
| 3.2 | none | `motion`, Vitest, Vercel AI SDK |
| 3.3 | `zustand` | `react-markdown`, MapLibre, Playwright |

### 8. Prompt mechanics (copy F2)

Each fence: read `AGENTS.md` + F3 locks first; TASK; FEATURE BUILDUP (EXISTS / STILL EMPTY); FAILURE MODE; LLD pattern; WHAT TO CREATE (concrete paths); RULES (Do NOT jump ahead); PowerShell VALIDATION.

F3a prerequisites: F2 ship checklist green; API up; a selectable destination (or known uuid in `?destination=`).

F3b prerequisites: F3a green; API can accept `POST /api/v1/planner/generate` (expect SSE or 409). Abort proof needs API logs.

F3 ship checklist at the bottom of `StepF3.md` before F4 expansion: invalid compose → no POST; 409 → no SSE parse; no `EventSource`; abort cancels fetch **and** server task; Generate click from home does not POST until `/generate` submit; sparse still allowed through; clarification answer starts a new POST with appended `raw_input`; navigate only with `trip_id`; `lib/api/planner.ts` still stub; `app/page.tsx` still has no `getJson`/`useQuery`; destinations feature has no `planner/generate`.

Update `docs/steps/README.md` with an F3 batches table. Leave F4–F7 outlines.

`docs/app/system.md` already says F2 as-built. Authoring pass cites it; do not rewrite the snapshot as if F3 code existed.

### 9. Auth and guest path

`POST /planner/generate` is **Optional** auth (guest `wandr_session`; may Set-Cookie). Do not wrap `/generate` in required-auth. Do not implement OAuth bounce (`FRONTEND_URL`).

## Risks / Trade-offs

- [Agent implements F3 code while writing the playbook] → Mitigation: every task and batch file restates docs-only; `lib/sse/planner.ts` must still be a stub when this change archives.
- [Agent pastes the whole `StepF3.md`] → Mitigation: header + README: one fence or one batch file.
- [3.2 uses `sendJson` or EventSource] → Mitigation: locked; VALIDATION greps `EventSource` (expected: no matches in planner/sse/generate) and greps `sendJson` in `lib/sse/planner.ts` (expected: no matches).
- [3.2 only stops the reader] → Mitigation: abort-integrity proof named in 3.2 VALIDATION; ship checklist cannot go green on client-only abort.
- [3.3 resumes the old stream on clarification] → Mitigation: locked helper + “fresh AbortController”; VALIDATION: no “resume” client; `buildClarificationRawInput` concatenates with newline.
- [Zustand / motion / Vitest installed in the authoring pass] → Mitigation: this change is docs-only; package.json must not change here. Later implement installs Zustand at 3.3 only.
- [F4 trip page missing → navigation 404] → Mitigation: 3.3 prompt creates a stub `app/trips/[id]/page.tsx`.
- [20s gateway timeout silently applied] → Mitigation: playbook forbids `sendJson`/`getJson` for generate; states why (timeout + JSON parse).
- [Local API down during later implement] → Mitigation: F3a/F3b prerequisites list API up; authoring this playbook does not need the API.

## Migration Plan

Docs-only. No deploy. Rollback = restore the F3 outline, delete `F3a.md` / `F3b.md` / `F3c.md`, revert the README F3 table.

## Open Questions

None. Batch split, `/generate` vs home compose, SSE outside `sendJson`, Vitest/motion deferred, Zustand at 3.3, stub trip route, and clarification-as-fresh-POST are locked above.
