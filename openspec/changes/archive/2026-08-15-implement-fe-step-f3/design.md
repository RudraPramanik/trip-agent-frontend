## Context

See `proposal.md` for why. Product SSOT is `docs/blueprint.md` F3; wire is `docs/frontendGuide.md` §7 SSE, §8 planner, and §14 `PlanRequest`; execution grain is `docs/steps/StepF3.md` (write) and `docs/steps/batches/F3a.md`–`F3c.md` (run). Specs: `specs/planner/spec.md`, `specs/destinations/spec.md`. Built-so-far: `docs/app/system.md` (F2).

F2 left `lib/sse/planner.ts`, `lib/api/planner.ts`, and `features/planner/index.ts` as `export {}`. Home Generate is a no-op `Button`. The JSON gateway (`getJson` / `sendJson`) applies a **20s** timeout and JSON-parses the body — it cannot carry a minutes-long SSE generate. Generated types already include `PlanRequest` and `POST /api/v1/planner/generate`. RHF/Zod are already installed. Clarification has no resume endpoint. Abort-integrity depends on aborting `fetch` so the API’s `request.is_disconnected()` poll actually cancels the background task.

Playbook sequence wins over the blueprint package table: no `motion` in F3; Vitest stays F7 (fixtures land in 3.2); `zustand` installs at 3.3 only.

## Goals / Non-Goals

**Goals:**
- Land F3 in playbook order: 3.1 then 3.2 then 3.3, three hard-stopped batches (F3a then F3b then F3c) inside one change.
- Keep SSE, planner UI, and page mount in separate modules so `/generate` never owns fetch and destinations never POSTs generate.
- Prove abort closes HTTP **and** the server task, not only that the reader stopped.

**Non-Goals:**
- `GET /trips/{id}`, GeoJSON, MapLibre, `react-markdown` (F4).
- Filling `lib/api/planner.ts` with envelope JSON generate.
- Extending `lib/api/client.ts` to stream.
- Vitest/Playwright, `motion`, NextAuth.
- Expanding `StepF4.md`–`StepF7.md`.
- Required-auth on `/generate`.

## Decisions

### 1. One change, three hard-stopped batches

Execute `docs/steps/batches/F3a.md` (3.1) then `F3b.md` (3.2) then `F3c.md` (3.3). Prompt bodies stay in `StepF3.md`. Do not merge 3.1–3.3 into one prompt body. Stop F3a until `/generate?destination=` shows the form, empty `raw_input` does not POST, and `lib/sse/planner.ts` is still a stub. Stop F3b until Cancel/navigate aborts the **server** task (API logs). Stop F3c at the F3 ship checklist.

**Alternative considered:** Three OpenSpec changes (`implement-fe-step-f3a` then `f3b` / `f3c`). Rejected — they share one SSE client, one feature folder, and one page; F1/F2 used one implement change per phase. Batch files remain the apply-session grain.

**Alternative considered:** One apply session that writes compose + SSE + clarification together. Rejected — playbook forbids jumping ahead; F3.2 is the dangerous slice and must not be skipped inside a UI rush.

### 2. SSE lives in `lib/sse/planner.ts`, not the JSON gateway

```
lib/sse/planner.ts                 POST fetch + ReadableStream parser; AbortController in fetch
                                   GENERATE_PATH = "/api/v1/planner/generate" satisfies keyof paths
                                   credentials: "include"; Accept: text/event-stream
                                   409 JSON before frames; MUST NOT use getJson / sendJson / EventSource

lib/api/planner.ts                 stays export {} — generate is not an ApiResponse call

features/planner/                  compose-form, use-planner-generate, progress, clarification, barrel
app/generate/page.tsx              Server Component; mounts planner barrel only
features/destinations/readiness-card.tsx
                                   Generate is a Link to /generate?destination=<id>
```

- Pass a **caller-owned** `AbortController.signal` into `fetch`. Abort on unmount, route change, and Cancel.
- Do not apply `AbortSignal.timeout(20_000)` from the gateway to this fetch.
- If `!res.ok`: read text, JSON.parse, `parseErrorResponse` / `ApiError` (especially 409 `destination_not_ready`).
- If ok: decode `ReadableStream`, split `event:` / `data:` frames, yield until the first terminal (`itinerary_done` | `error` | `clarification_needed`).
- Invalidating `["destinations","readiness", id]` by key tuple from the planner hook is allowed. Do not import `lib/api/destinations`.

**Alternative considered:** `EventSource`. Rejected — GET-only; generate is POST with a JSON body.

**Alternative considered:** Route generate through `sendJson`. Rejected — 20s timeout + JSON body parse would kill the stream.

**Alternative considered:** Put progress UI in `components/generate/`. Rejected — principle #16; blueprint folder tree is illustrative.

### 3. Compose on `/generate`; destination id from the URL

Zod schema mirrors generated `PlanRequest`. `destination_id` comes from `searchParams` (this Next line may type them as a Promise — await if required). Missing id → pick-a-destination + `Link` to `/`. Submit in 3.1 MUST NOT fetch; 3.2 wires `start(planRequest)`.

Home Generate becomes a `Link` (or Button asChild + Link) to `/generate?destination=${id}` when id is present. Still enabled for `ready` / `limited` / `sparse`. Destinations MUST NOT import `lib/sse/planner`.

`app/generate/page.tsx` MUST NOT import `getJson`, `sendJson`, `fetch`, `useQuery`, or `EventSource`. Do not wrap `/generate` in required-auth. Do not put compose in `session-header`. Do not use Zustand for form fields.

**Alternative considered:** Compose on home under the readiness card. Rejected — playbook locks compose on `/generate` so home stays destinations-only.

**Alternative considered:** Zustand for compose fields. Rejected — RHF is enough; Zustand is narrative Option A at 3.3 only.

### 4. 3.2 is a crude generating/cancel surface

3.2 MUST wire valid submit to generate so abort can be proved: “Generating…”, Cancel, 409 panel, generic error. Phase/tool list is 3.3. Commit parser-facing fixtures under `lib/sse/fixtures/` (progress+`itinerary_done`, `clarification_needed`, `error`, cache-hit omitting `tool_*`). Do not install Vitest or `motion`.

**End-to-end abort proof (required):** start a generate, Cancel or leave `/generate`, confirm API logs show the background task canceled within a few seconds. Client-only “reader stopped” is not enough. F3b is not green without this.

**Alternative considered:** Library-only 3.2 with no UI. Rejected — abort-integrity needs a way to start and cancel a live generate.

**Alternative considered:** Install `motion` for progress (blueprint package table). Rejected — playbook: CSS/status text; no `motion` in F3.

### 5. Clarification is a fresh POST; narrative is thin Zustand

`buildClarificationRawInput(original, answer)` MUST return `` `${original}\n${answer}` `` (preserve original exactly). Export from `lib/sse/planner.ts` (or a tiny sibling) so F7 can unit-test later. Fresh generate: new `AbortController`, abort the previous controller first, reset progress to empty. There is no resume URL.

On `itinerary_done`: if day title/narrative present, write `store/narrative.ts` keyed by `trip_id`, then `router.push` only if `trip_id` is a non-empty string. Install `zustand` once at 3.3. Hard reload may drop prose.

`app/trips/[id]/page.tsx`: Server Component stub (“Trip detail lands in F4.”). No trips HTTP. Clarification UI is inline, not a page-blocking modal; original `raw_input` stays visible.

**Alternative considered:** Resume the prior stream. Rejected — no backend resume endpoint; AGENTS.md hard rule.

**Alternative considered:** `GET /trips/{id}` immediately after navigate. Rejected — F4; stub prevents 404 only.

### 6. Encode generate outside the gateway; keep path type-locked

`POST` via `fetch` to `getPublicApiUrl() + GENERATE_PATH`. Body `JSON.stringify(PlanRequest)`. Types from `types/generated/api.d.ts`. Do not hand-mirror `frontendGuide.md` §14. Do not invent `ClarificationNeededOut` in `types/generated/`. Clarification `data`: prefer `question` string; else conservative fallback from known keys.

**Alternative considered:** Add a streaming helper to `lib/api/client.ts`. Rejected — F3 does not need a second gateway; keep the JSON client’s timeout/parse contract intact.

## Risks / Trade-offs

- [Sibling API or `.env.local` missing] → Mitigation: F3a needs a selectable destination; F3b needs live generate or 409. Stop the batch if the API is down; do not stub itineraries.
- [Abort looks fine in DevTools but server keeps generating] → Mitigation: F3b hard-requires API log proof (`request.is_disconnected` / task cancelled). Client Network “canceled” alone is not the ship bar.
- [409 parsed as SSE] → Mitigation: `!res.ok` JSON path before the reader loop; 409 panel + link home.
- [Agent uses EventSource or sendJson] → Mitigation: batch hard stops; ship checklist forbids both.
- [Clarification treated as error or “resumed”] → Mitigation: 3.3 lock + `buildClarificationRawInput` + new POST proof in Network.
- [Navigate to `/trips/undefined`] → Mitigation: navigate only when `trip_id` is a non-empty string; stub page still has no trips HTTP.
- [20s gateway timeout accidentally copied] → Mitigation: Decision 2; do not call `getJson`/`sendJson` for generate.
- [searchParams Promise vs sync] → Mitigation: same as F2 home; confirm against this Next line’s docs at apply time.

## Migration Plan

Local FE only. Operators need `.env.local` (`NEXT_PUBLIC_API_URL=http://localhost:8000`) and the sibling API so generate SSE (or 409) answers. Abort-integrity needs API process logs.

Rollback = revert this change’s commits (planner stubs and no-op Generate return). No production deploy.

After the F3 ship checklist in `StepF3.md` is green, update `docs/app/system.md` to the F3 as-built snapshot. A separate change expands `StepF4.md`.

## Open Questions

None. Batch split, SSE-not-gateway, abort-in-fetch, 409-as-JSON, clarification-as-fresh-POST, Zustand-at-3.3, stub trip page, and no Vitest/motion are locked in `StepF3.md`.
