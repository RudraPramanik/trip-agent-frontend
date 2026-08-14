# Wandr — F3 outline: Compose + planner SSE

> **Outline only.** Expand after **F2** ships. Template: [`_template.md`](_template.md).
> Blueprint: [`docs/blueprint.md`](../blueprint.md) — F3. Wire: [`docs/frontendGuide.md`](../frontendGuide.md) §7 SSE.

**Do not implement F3 from this outline.** F3.2 is the dangerous slice — keep it its own prompt.

## Phase goal

Compose `PlanRequest`, abortable POST SSE (not EventSource), progress UI, terminals including clarification as a **fresh** generate.

## Expand after

F2 ship: search + readiness; generate CTA exists.

## Feature buildup (target)

| After | Exists | Still empty / forbidden |
|-------|--------|-------------------------|
| 3.1 | Compose form; Zod vs generated `PlanRequest`; invalid → no fetch | No SSE yet |
| 3.2 | `lib/sse/planner.ts`; real `AbortController` in `fetch`; 409 pre-stream; Vitest-later fixtures | No EventSource; no auto-retry |
| 3.3 | Progress + terminals; `itinerary_done` → `/trips/{trip_id}`; clarification inline + resubmit | No stream resume endpoint |

## Failure modes to name when expanding

- 409 `destination_not_ready` is **not** SSE
- Abort on unmount must close the HTTP request (server `is_disconnected()`). Client-only “stopped reading” is **not** done — manual e2e abort proof required
- `clarification_needed` is terminal, not an error; `raw_input = original + "\n" + answer`
- Timeout / `generation_timeout` / `graph_recursion_limit` → error panel; user resubmits
- Cache hit may omit `tool_*` events

## Likely run batches

| Batch | Sub-steps | Notes |
|-------|-----------|--------|
| F3a | 3.1 | Form only |
| F3b | 3.2 | SSE client + abort proof (own session) |
| F3c | 3.3 | Progress UI + clarification loop |

Optional: `motion` at 3.2 if progress animation is used.

## LLD

Abortable Stream. Narrative Option A in thin Zustand keyed by `trip_id` (install Zustand here if not already).
