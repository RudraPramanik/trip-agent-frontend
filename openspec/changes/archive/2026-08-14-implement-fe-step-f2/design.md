## Context

See `proposal.md` for why. Product SSOT is `docs/blueprint.md` F2; wire is `docs/frontendGuide.md` §8 destinations and §14 `DestinationOut` / `DestinationReadinessOut`; execution grain is `docs/steps/StepF2.md` (write) and `docs/steps/batches/F2a.md`–`F2b.md` (run). Specs: `specs/destinations/spec.md`, `specs/session-shell/spec.md`. Built-so-far: `docs/app/system.md` (F1).

F1 left `lib/api/destinations.ts` and `features/destinations/index.ts` as `export {}`. Home still shows the F1 placeholder. The gateway already sends `credentials: "include"`, retries GET once, and toasts query errors (session probe opts out via `skipErrorToast`). `getJson` has no query-params option — callers pass a path string. Generated types already include both destination paths and DTOs. Search is live-limited to **20/min/IP**. Sparse is warn-and-allow (blueprint F2.2). No `search_available` on the wire.

## Goals / Non-Goals

**Goals:**
- Land F2 in playbook order: 2.1 then 2.2, two hard-stopped batches (F2a then F2b) inside one change.
- Keep HTTP, server-state, and page mount in separate modules so home and header never own destinations fetch.
- Treat `sparse` as warn-and-allow; Generate never starts planner SSE.

**Non-Goals:**
- Planner compose / `POST /planner/generate` / EventSource / abort-integrity (F3).
- Extending `lib/api/client.ts` with a query-params API.
- Zustand, MapLibre, Vitest/Playwright, NextAuth.
- Expanding `StepF3.md`–`StepF7.md`.
- Proving 429 under load in CI.

## Decisions

### 1. One change, two hard-stopped batches

Execute `docs/steps/batches/F2a.md` (2.1) then `F2b.md` (2.2). Prompt bodies stay in `StepF2.md`. Do not merge 2.1–2.2 into one prompt body. Stop F2a until typing "Da" hits search (or empty UI), 1 character sends no request, and `lib/api/destinations.ts` has no readiness yet. Stop F2b at the F2 ship checklist.

**Alternative considered:** Two OpenSpec changes (`implement-fe-step-f2a` then `f2b`). Rejected — they share one module, one feature folder, and one page; F1 used one implement change per phase. Batch files remain the apply-session grain.

**Alternative considered:** One apply session that writes search and readiness together. Rejected — playbook forbids jumping to 2.2 inside 2.1; proving no-readiness-yet is an F2a validation line.

### 2. Three layers: domain HTTP, feature hooks/UI, page mount

```
app/page.tsx                         Server Component; mounts DestinationSearch (+ ReadinessCard in 2.2)
features/destinations/               hooks, search field/results, readiness card, public barrel
lib/api/destinations.ts              searchDestinations / getDestinationReadiness — mirror lib/api/auth.ts
lib/api/client.ts                    unchanged F0 gateway
features/auth/session-header.tsx     Search stays a Link; no destinations import
```

- `SEARCH_PATH = "/api/v1/destinations/search" satisfies keyof paths`.
- `READINESS_PATH` pattern `"/api/v1/destinations/{destination_id}/readiness" satisfies keyof paths` (add in 2.2 only).
- Query keys MUST be `["destinations","search", q]` and `["destinations","readiness", id]`. Pass the query function’s `AbortSignal`. `retry: 1`.
- `app/page.tsx` MUST NOT import `getJson`, `searchDestinations`, `getDestinationReadiness`, or `useQuery`.
- Do not put typeahead in the header. Optional: Search `Link` href `/#destination-search` and `id="destination-search"` on the home compose component.

**Alternative considered:** Typeahead in `SessionHeader`. Rejected — principle #16 and F2 locks; header stays fetch-free.

**Alternative considered:** `useQuery` on `app/page.tsx`. Rejected — page would own Query keys and DTO parsing.

### 3. Encode query and path params in the domain module

`getJson` takes a path string only. Do not add a `query` option to the gateway in F2.

- Search: `getJson(\`${SEARCH_PATH}?q=${encodeURIComponent(q)}\`, { signal, parse: "api" })` typed as `components["schemas"]["DestinationOut"][]`.
- Readiness: substitute `{destination_id}` with `encodeURIComponent(destinationId)` on a copy of the path key; `parse: "api"` typed as `components["schemas"]["DestinationReadinessOut"]`.

**Alternative considered:** Extend `getJson` with searchParams. Rejected — F2 does not need a gateway change; auth/health do not use it yet. Revisit if F3+ repeats the pattern often.

### 4. Debounce the query key; RHF + Zod once; no debounce package

Install `react-hook-form`, `zod`, `@hookform/resolvers` at 2.1 only. Debounce ~300ms in `useDestinationSearch` (or the compose component) with a local timeout so the **debounced** `q` is the Query key. `enabled: q.trim().length >= 2`. A small Zod schema for `q` is enough. F3 reuses the form stack.

On `ApiError` with `status === 429` or `code === "rate_limit_exceeded"`: rely on existing QueryCache toast; disable the input ~2s (local state / timeout). Do not add a second toaster.

**Alternative considered:** `useDeferredValue` or a debounce npm package. Rejected — playbook forbids a debounce package; a 300ms timeout is explicit and easy to prove.

**Alternative considered:** Skip RHF until F3. Rejected — packages-at-point-of-use installs them once at 2.1 so F3 does not invent a second form stack.

### 5. Selection is the URL, not Zustand

`search-results.tsx` writes `?destination=<id>` via `next/navigation` (`useRouter` replace or push). Readiness reads that id. Do not add a destinations store.

`app/page.tsx` stays a Server Component. This Next line may type `searchParams` as a Promise — await it if required (read `node_modules/next/dist/docs/` at apply time). Pass `destinationId` into `ReadinessCard`. The page still MUST NOT parse `DestinationReadinessOut`.

**Alternative considered:** Zustand for selected destination. Rejected — F2 lock; F3 needs the id in the URL anyway.

**Alternative considered:** Client page that calls `useSearchParams` and also `useQuery`. Rejected — would put Query on the page.

### 6. Warn-and-allow Generate is a no-fetch button

`readiness-card.tsx` shows tier / score / place_count / enriched_pct / indexed_pct / message. Generate is `type="button"`, enabled for `ready`, `limited`, and `sparse`. `sparse` warning more prominent (e.g. amber). `onClick` MUST NOT fetch planner; preserving `?destination=` is enough. Helper text MAY say compose is next (F3).

404: `ApiError.status === 404` → not-found panel, no card metrics. Missing id → render nothing (hook `enabled: Boolean(id)`).

**Alternative considered:** Disable Generate when `tier === "sparse"`. Rejected — blueprint F2.2 pinned warn-and-allow.

**Alternative considered:** Navigate to a stub `/compose` route. Rejected — that route is F3; a no-op button plus helper text is the playbook minimum.

## Risks / Trade-offs

- [Sibling API or `.env.local` missing] → Mitigation: F2a tasks start by proving `GET /api/v1/destinations/search?q=Da`. Stop the batch if the API is down; do not stub search results.
- [Empty catalog / "Da" matches nothing] → Mitigation: empty UI is a valid 2.1 proof; F2b can use a known uuid in `?destination=` if search has no rows.
- [429 under normal typing] → Mitigation: debounce; brief disable. Load-test 429 is optional/manual.
- [GET retry + Query retry on 5xx] → Mitigation: Query `retry: 1` only; results/card show error + retry, not a page spinner.
- [Agent jumps to F3 or hard-blocks sparse] → Mitigation: batch hard stops; ship checklist forbids `planner/generate` and `search_available`.
- [searchParams Promise vs sync] → Mitigation: Decision 5; confirm against this Next line’s docs at apply time.

## Migration Plan

Local FE only. Operators need `.env.local` (`NEXT_PUBLIC_API_URL=http://localhost:8000`) and the sibling API so destinations search answers.

Rollback = revert this change’s commits (destinations stubs and F1 home placeholder return). No production deploy.

After the F2 ship checklist in `StepF2.md` is green, update `docs/app/system.md` to the F2 as-built snapshot. A separate change expands `StepF3.md`.

## Open Questions

None. Batch split, URL selection, warn-and-allow, no `search_available`, header-as-Link, and packages-at-2.1 are locked in `StepF2.md`.
