# Wandr — F2 Cursor prompts: Destinations search + readiness

> Blueprint: [`docs/blueprint.md`](../blueprint.md) — Phase F2 (~1–2 days · search + readiness)
> Wire contract: [`docs/frontendGuide.md`](../frontendGuide.md) §8 destinations, §14 `DestinationOut` / `DestinationReadinessOut`
> Guardrails: [`AGENTS.md`](../../AGENTS.md) — principle #16 Modular by default
> Built-so-far: [`docs/app/system.md`](../app/system.md)
> Runner: [`README.md`](README.md)
>
> One prompt per sub-step. Paste **one** fence into Agent mode, or run a batch file under [`batches/`](batches/).
> Do not start the next prompt until the current validation passes.

**Run order is numeric:** **2.1 → 2.2**.

| Batch | File | Sub-steps |
|-------|------|-----------|
| F2a | [`batches/F2a.md`](batches/F2a.md) | 2.1 |
| F2b | [`batches/F2b.md`](batches/F2b.md) | 2.2 |

---

## How to use these prompts

1. Workspace root is this repo (`guideagent-frontend`). It **is** the Next.js app.
2. Read `node_modules/next/dist/docs/` before writing App Router code (this Next line has breaking changes vs training data).
3. Run one batch **or** paste one fence — not this whole file.
4. Validation is PowerShell-first.
5. If the agent adds extra packages, skips a failure boundary, puts destinations fetch in the header, or starts the next sub-step: stop and correct.

## Prerequisites (F1 must be complete)

- F1 ship checklist in [`StepF1.md`](StepF1.md) is green (cookie probe, login/logout, `SessionHeader`, Search placeholder as a `Link` to `/`).
- `lib/api/destinations.ts` and `features/destinations/index.ts` are still stubs (`export {}`).
- F2a needs the sibling API at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) with `GET /api/v1/destinations/search?q=Da` reachable.

## Prompt conventions (every step)

- First line of every prompt: read `AGENTS.md` and the F2 locks below.
- **Extend, don't replace** F1 code unless the step says replace.
- **Packages at point of use** — 2.1 installs RHF + Zod + resolvers **once**. 2.2 installs none.
- **PowerShell-first** validation (`Select-String`, `Get-ChildItem`).
- **Do NOT jump ahead** to the next sub-step inside a single prompt body.
- Never invent endpoints or DTO fields. OpenAPI / `types/generated/api.d.ts` win on wire shapes; this playbook wins on sequence, layers, and proofs.

## F2 architecture

```
lib/api/destinations.ts                      HTTP only: searchDestinations (2.1),
                                             getDestinationReadiness (2.2)
                                             generated paths + DestinationOut +
                                             DestinationReadinessOut
                                             AbortSignal; credentials via gateway
                                             mirror lib/api/auth.ts / health.ts

features/destinations/use-destination-search.ts       Query key ["destinations","search", q]
features/destinations/use-destination-readiness.ts    Query key ["destinations","readiness", id]
features/destinations/search-field.tsx                input + debounce ~300ms; no request if q < 2
features/destinations/search-results.tsx              list or empty UI; select → ?destination=
features/destinations/destination-search.tsx          compose field + results (page-facing)
features/destinations/readiness-card.tsx              tier / score / place_count / enriched_pct /
                                                      indexed_pct / message; generate enabled every tier
features/destinations/index.ts                        public barrel only

app/page.tsx                                 mounts DestinationSearch (+ ReadinessCard in 2.2)
                                             no getJson / no Query keys / no DTO parsing

features/auth/session-header.tsx             Search stays a Link to / (guest-reachable)
                                             MUST NOT import lib/api/destinations or fire search
```

Principle #16: HTTP in the domain module; hooks/UI in `features/destinations/`; the page only mounts the barrel. Auth chrome stays fetch-free.

## Locked decisions

### Modular layers — LOCKED

- HTTP stays in `lib/api/destinations.ts`. Hooks and search/readiness UI stay in `features/destinations/`. `app/page.tsx` only mounts public barrel exports.
- Do not put search typeahead in `features/auth/session-header.tsx`. Header Search remains a `Link` to `/` (or `/#destination-search`).
- Do not put `useQuery` / `DestinationOut` parsing in `app/page.tsx` or a global `hooks/` folder.
- Features MUST NOT import each other’s HTTP modules. Home composes destinations; header stays auth.
- Wire types from `types/generated/api.d.ts`. Do not hand-mirror `frontendGuide.md` §14. Do **not** invent `search_available`.

### Home search + URL selection — LOCKED

- Real search lives on `/` (replaces the F1 home placeholder “Destination search lands in F2”).
- Selecting a result writes `?destination=<uuid>` (readable by 2.2 and later F3). Not Zustand.
- Guests can search. No login wall.

### Search contract — LOCKED (implement in 2.1)

- `GET /api/v1/destinations/search?q=` — `q` min length **2**; no request when `q.trim().length < 2`.
- Debounce input ~300ms. Live limiter is **20/min/IP**. On `429` / `rate_limit_exceeded`: existing QueryCache toast + brief disable of the search control (~2s). Proving 429 under load is optional/manual, not CI.
- Empty `data` array → empty UI (“No destinations match”); never fake rows.
- Query key MUST be `["destinations","search", q]` (short `staleTime` OK). Pass the Query `AbortSignal` into `searchDestinations`.

### Readiness warn-and-allow — LOCKED (implement in 2.2)

| Tier | Generate CTA | Warning |
|------|----------------|---------|
| `ready` | enabled | none |
| `limited` | enabled | inline `message` |
| `sparse` | enabled | inline `message`, more prominent (e.g. amber) |

- Never `disabled={tier === "sparse"}`. 404 → not-found panel, no card.
- Show `tier` / `score` / `place_count` / `enriched_pct` / `indexed_pct` / `message` from `DestinationReadinessOut`.
- Generate CTA MUST NOT `POST /planner/generate` or open an SSE client (F3). Enabled button that preserves `?destination=` is enough; helper text may say compose is next.
- Query key MUST be `["destinations","readiness", id]`.

### Packages — LOCKED

| Step | Install | Do not |
|------|---------|--------|
| 2.1 | `react-hook-form`, `zod`, `@hookform/resolvers` (once; F3 compose reuses) | axios, debounce package, NextAuth |
| 2.2 | none | planner SSE deps, Zustand, MapLibre |

### Forward locks (do not implement in F2)

- Planner compose form / `POST /planner/generate` / EventSource ban / abort-integrity (F3)
- MapLibre, trip detail, markdown narrative (F4)
- Claim / trip list (F5)
- Vitest, Playwright (F7)
- Zustand store logic
- `FRONTEND_URL` OAuth bounce (backend follow-up)

## Failure-mode table — LOCKED (F2)

| Failure | Response this phase must implement | Lands in |
|---------|-------------------------------------|----------|
| `q` < 2 | No request (`enabled: false` on the Query) | 2.1 |
| 429 / `rate_limit_exceeded` | Existing QueryCache toast + brief search-control disable | 2.1 |
| Empty search list | Empty UI; no fake destinations | 2.1 |
| Search network / 5xx | Existing Query error toast; results area shows retry/error, not a spinner forever | 2.1 |
| 404 destination readiness | Not-found panel; no readiness card | 2.2 |
| `limited` / `sparse` | Generate still enabled; `sparse` warning more prominent | 2.2 |

## Feature buildup

| After | Exists | Still empty / forbidden |
|-------|--------|-------------------------|
| 2.1 | `searchDestinations`; `useDestinationSearch`; search field + results on `/`; RHF/Zod installed; debounce; `q` min 2; 429 disable | No readiness HTTP; no generate CTA; header has no destinations fetch |
| 2.2 | `getDestinationReadiness`; `useDestinationReadiness`; readiness card; generate enabled at every tier | No `search_available`; no hard-block on `sparse`; no `POST /planner/generate` |

## LLD / FE patterns this phase

| Pattern | Where |
|---------|--------|
| Domain modules | `lib/api/destinations.ts` (HTTP only) |
| Server-state cache | Query keys `["destinations","search", q]` and `["destinations","readiness", id]` |
| Feature folders + Modular layers | `features/destinations/*`; `app/page.tsx` mounts barrel |
| Null / empty UI | empty search; 404 readiness; `sparse` warn-and-allow |

## Recommended run batches

| Batch | Sub-steps | Proof before next |
|-------|-----------|-------------------|
| F2a | 2.1 | Type "Da" → results or empty; 1 char → no request; header still has no destinations HTTP | Requires local API |
| F2b | 2.2 | Select a result → readiness fields; generate enabled on `sparse`; no planner generate fetch |

---

## Step 2.1 — Destination search

```
Read AGENTS.md, docs/app/system.md, docs/steps/StepF2.md (locks + this step), docs/frontendGuide.md §8 destinations, docs/blueprint.md principle #16, and node_modules/next/dist/docs/ before writing any file.

TASK: Implement destination search through the F0 gateway. Typeahead on home (not in the header). q min 2, debounce ~300ms, empty UI, 429 brief disable. Install RHF + Zod + resolvers once.

This is step 2.1. Do NOT add readiness HTTP, a generate CTA, or planner SSE. Do NOT put search fetch in session-header.

─── FEATURE BUILDUP ───
After this step:
  EXISTS: searchDestinations in lib/api/destinations.ts; useDestinationSearch; search-field + search-results composed on /; Query key ["destinations","search", q]; no request if q < 2; debounce; 429 toast (existing) + brief disable; empty list UI; react-hook-form, zod, @hookform/resolvers in package.json.
  STILL EMPTY: getDestinationReadiness; readiness-card; generate CTA; no planner generate.

─── FAILURE MODE ───
- q.trim().length < 2: do not call GET /destinations/search (Query enabled: false). Helper text "Type at least 2 characters" is enough — not a blocking red error.
- 429 / rate_limit_exceeded: rely on existing QueryCache toast; briefly disable the search input (~2s). Do not add a second custom toast stack.
- Empty data array: "No destinations match" (or equivalent). Never invent destinations.
- Network / 5xx: existing Query error toast; results area shows error + retry (refetch), not an infinite spinner.
- Header Search click must still navigate to / and MUST NOT fire destinations/search by itself.

─── LLD / BEST PRACTICE ───
Pattern: Domain module + Server-state cache + Feature folders + Modular layers (principle #16).
Mirror lib/api/auth.ts: path satisfies keyof paths; getJson with signal; parse "api".
Type the payload as components["schemas"]["DestinationOut"][] from types/generated/api.d.ts.
Query key MUST be ["destinations","search", q] (tuple). Pass the Query function's AbortSignal into searchDestinations. Short staleTime is OK.
Debounce the q used as the query key (~300ms). Do not add a debounce npm package.
Install: npm install react-hook-form zod @hookform/resolvers — once. Search may use a small Zod schema for q. F3 will reuse these packages; do not invent a second form stack.

─── WHAT TO CREATE ───

1. lib/api/destinations.ts — replace the F2 stub:
   - SEARCH_PATH = "/api/v1/destinations/search" satisfies keyof paths
   - searchDestinations(q: string, signal?: AbortSignal): Promise<DestinationOut[]> via getJson(..., { signal, parse: "api" }) with query param q
   - Do NOT add getDestinationReadiness yet.

2. features/destinations/use-destination-search.ts ("use client"):
   - useQuery({ queryKey: ["destinations", "search", q], queryFn: ({ signal }) => searchDestinations(q, signal), enabled: q.trim().length >= 2, retry: 1 })
   - Debounce q before it becomes the query key (~300ms).
   - Export data, isFetching, isError, refetch, and enough to detect 429 (ApiError status 429 or code rate_limit_exceeded).

3. features/destinations/search-field.tsx — input wired with RHF (or RHF watch). Label the control for a11y. Not in the header.

4. features/destinations/search-results.tsx — list DestinationOut.display_name (and country if useful). Click/select writes ?destination=<id> via next/navigation (replace or push). Empty and error states as above. No readiness fetch.

5. features/destinations/destination-search.tsx — compose field + results (shared q). This is the page-facing export so app/page.tsx does not own debounce or Query keys. Optional id="destination-search" for the header Link.

6. app/page.tsx — Server Component mounts DestinationSearch (replace the F1 "Destination search lands in F2" placeholder). MUST NOT import getJson, searchDestinations, or useQuery.

7. features/destinations/index.ts — barrel: export DestinationSearch (and hooks if useful). Do not export a kitchen-sink object.

8. features/auth/session-header.tsx — Search stays a Link to "/" or "/#destination-search". Do not import destinations HTTP. Do not add an input that fires search.

─── RULES FOR THIS STEP ───
- Do NOT jump ahead to step 2.2 (no readiness, no generate CTA).
- Do NOT put fetch / getJson / useQuery in session-header or app/page.tsx.
- Do NOT install axios or a debounce package.
- Do NOT call POST /planner/generate.
- Do NOT invent search_available.

─── VALIDATION ───
  Select-String -Path lib\api\destinations.ts -Pattern "destinations/search"
  Select-String -Path lib\api\destinations.ts -Pattern "readiness"   # Expected: no matches yet
  Select-String -Path features\destinations -Pattern 'destinations","search"|destinations", "search"' -Recurse
  Select-String -Path package.json -Pattern "react-hook-form"|"zod"|"@hookform/resolvers"
  Select-String -Path features\auth\session-header.tsx -Pattern "destinations/search|searchDestinations|getJson"   # Expected: no matches
  Select-String -Path app\page.tsx -Pattern "getJson|useQuery|searchDestinations"   # Expected: no matches
  Test-Path features\destinations\use-destination-search.ts
  Test-Path features\destinations\search-field.tsx
  Test-Path features\destinations\search-results.tsx

  npm run dev
  # Browser: http://localhost:3000 shows a search field on home (guest OK).
  # Type 1 character: Network has no GET .../destinations/search.
  # Type "Da": after ~300ms, GET {API}/api/v1/destinations/search?q=Da with credentials → results or empty UI.
  # Header Search still a link; clicking it does not by itself spam search requests.
  # Rapid typing: request count visibly lower than keystrokes (debounce).
```

---

## Step 2.2 — Readiness gate

```
Read AGENTS.md, docs/app/system.md, docs/steps/StepF2.md (locks + this step), docs/frontendGuide.md §8 destinations, docs/blueprint.md F2.2 (warn-and-allow), and node_modules/next/dist/docs/ before writing any file.

TASK: Show destination readiness after the user selects a search result. Warn-and-allow at every tier including sparse. Generate CTA enabled but MUST NOT start planner SSE. 404 → not-found. No invented search_available.

This is step 2.2. Last F2 code step. Do NOT start F3 (no PlanRequest form, no POST /planner/generate). No new packages.

─── FEATURE BUILDUP ───
After this step:
  EXISTS: getDestinationReadiness; useDestinationReadiness; readiness-card; Query key ["destinations","readiness", id]; generate CTA enabled at ready/limited/sparse; 404 not-found.
  STILL EMPTY: planner SSE; compose Zod for PlanRequest (packages already installed — do not use them for generate yet); no search_available field.

─── FAILURE MODE ───
- Missing ?destination=: show no card (search UI still visible). Do not fetch readiness with an empty id.
- 404 destination: not-found panel. Do not render fake tier/score.
- limited: generate enabled + inline message from the API.
- sparse: generate STILL enabled + inline message styled more prominently (e.g. amber vs neutral). Never disabled={tier === "sparse"}.
- Network / 5xx on readiness: existing Query error toast; card area shows error + retry, not an infinite spinner.
- Generate click: MUST NOT call /planner/generate. Preserve ?destination=. Helper text may say compose is next (F3).

─── LLD / BEST PRACTICE ───
Pattern: Domain module + Server-state cache + Null / empty UI + Modular layers.
Add getDestinationReadiness next to searchDestinations. Path "/api/v1/destinations/{destination_id}/readiness" satisfies keyof paths. getJson parse "api". Type as components["schemas"]["DestinationReadinessOut"].
Query key MUST be ["destinations","readiness", id]. enabled when id is a non-empty string. Pass AbortSignal.
Read destination id from the URL query ?destination= (set in 2.1). Check node_modules/next/dist/docs/ for searchParams on app/page.tsx in this Next line (it may be a Promise). Page may pass destinationId into ReadinessCard; page still MUST NOT call getJson or useQuery.
Do not add Zustand. Do not invent search_available. Do not hard-block sparse.

─── WHAT TO CREATE ───

1. lib/api/destinations.ts — keep searchDestinations; add:
   - READINESS_PATH pattern for "/api/v1/destinations/{destination_id}/readiness" satisfies keyof paths
   - getDestinationReadiness(destinationId: string, signal?: AbortSignal): Promise<DestinationReadinessOut>

2. features/destinations/use-destination-readiness.ts ("use client"):
   - useQuery({ queryKey: ["destinations", "readiness", id], queryFn: ({ signal }) => getDestinationReadiness(id, signal), enabled: Boolean(id), retry: 1 })
   - Surface 404 vs other errors so the card can show not-found.

3. features/destinations/readiness-card.tsx — when id present and success: show tier, score, place_count, enriched_pct, indexed_pct, message. Generate button enabled for ready, limited, and sparse. limited/sparse show message; sparse more prominent. 404 → not-found copy. Generate onClick MUST NOT fetch planner.

4. app/page.tsx — still a Server Component. Mount DestinationSearch and ReadinessCard. Pass destination id from searchParams into the card (do not parse DestinationReadinessOut on the page).

5. features/destinations/index.ts — also export ReadinessCard (and useDestinationReadiness if useful).

6. Leave session-header unchanged: still no destinations HTTP.

─── RULES FOR THIS STEP ───
- Do NOT implement compose / SSE / EventSource.
- Do NOT add Zustand.
- Do NOT install packages.
- Do NOT invent search_available.
- Do NOT disable Generate on sparse.
- Do NOT jump ahead to F3.

─── VALIDATION ───
  Select-String -Path lib\api\destinations.ts -Pattern "readiness"
  Select-String -Path features\destinations -Pattern 'destinations","readiness"|destinations", "readiness"' -Recurse
  Select-String -Path features\destinations -Pattern "search_available" -Recurse   # Expected: no matches
  Select-String -Path features\destinations\readiness-card.tsx -Pattern "planner/generate"   # Expected: no matches
  Select-String -Path app\page.tsx -Pattern "planner/generate|getJson|useQuery"   # Expected: no matches
  Select-String -Path features\auth\session-header.tsx -Pattern "getDestinationReadiness|destinations/search"   # Expected: no matches
  Select-String -Path features\destinations\readiness-card.tsx -Pattern "sparse"
  Test-Path features\destinations\readiness-card.tsx
  Test-Path features\destinations\use-destination-readiness.ts

  npm run dev
  # Browser: search "Da", select a result → URL has ?destination=<uuid>; card shows tier + message.
  # If the selected destination is sparse: Generate is still clickable; warning is visible.
  # Generate click: no POST /api/v1/planner/generate in Network.
  # Bad uuid in ?destination=: not-found panel, not a crash.
```

---

## F2 ship checklist

Do not author full F3 prompts or start F3 code until every item is green:

```
# 2.1
Select-String -Path lib\api\destinations.ts -Pattern "destinations/search"
Select-String -Path features\destinations -Pattern 'destinations","search"|destinations", "search"' -Recurse
Select-String -Path package.json -Pattern "react-hook-form"
Select-String -Path features\auth\session-header.tsx -Pattern "searchDestinations|getJson"   # Expected: no matches
# Browser: type 1 char → no search request; type "Da" → results or empty; debounce reduces requests

# 2.2
Select-String -Path lib\api\destinations.ts -Pattern "readiness"
Select-String -Path features\destinations -Pattern "search_available" -Recurse   # Expected: no matches
Select-String -Path features\destinations\readiness-card.tsx -Pattern "planner/generate"   # Expected: no matches
# Browser: select destination → tier + message; Generate enabled on sparse; no planner POST

# Guard
Select-String -Path app\page.tsx -Pattern "getJson|useQuery"
# Expected: no matches (page mounts barrels only)
Test-Path AGENT.md   # Expected: False
```

All checks passing → F2 is done. Next: expand [`StepF3.md`](StepF3.md) from outline into full prompts, then run F3 batches. Do not implement F3 until that expansion exists.
