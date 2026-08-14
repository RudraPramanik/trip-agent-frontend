# Wandr — F0 Cursor prompts: Scaffold & core client

> Blueprint: [`docs/blueprint.md`](../blueprint.md) — Phase F0 (~2.5 days · guest foundation)
> Wire contract: [`docs/frontendGuide.md`](../frontendGuide.md)
> Guardrails (after 0.1): [`AGENTS.md`](../../AGENTS.md)
> Runner: [`README.md`](README.md)
>
> One prompt per sub-step. Paste **one** fence into Agent mode, or run a batch file under [`batches/`](batches/).
> Do not start the next prompt until the current validation passes.

**Run order is not numeric.** Blueprint numbers stay 0.1–0.6. Execute: **0.1 → 0.2 → 0.6 → 0.3 → 0.5 → 0.4**. Type-lock (0.6) before the gateway (0.3). shadcn (0.5) before providers (0.4).

| Batch | File | Sub-steps |
|-------|------|-----------|
| F0a | [`batches/F0a.md`](batches/F0a.md) | 0.1 → 0.2 |
| F0b | [`batches/F0b.md`](batches/F0b.md) | 0.6 → 0.3 |
| F0c | [`batches/F0c.md`](batches/F0c.md) | 0.5 → 0.4 |

---

## How to use these prompts

1. Workspace root is this repo (`guideagent-frontend`). It **is** the Next.js app.
2. Read `node_modules/next/dist/docs/` before writing App Router code (this Next line has breaking changes vs training data).
3. Run one batch **or** paste one fence — not this whole file.
4. Validation is PowerShell-first.
5. If the agent adds packages not listed, skips a failure boundary, or starts the next sub-step: stop and correct.

## Prerequisites (before F0a)

- This repo already has Next.js, React, TypeScript, ESLint, Tailwind v4. **Do not** run `create-next-app`. **Do not** add a nested `wandr-web/` folder.
- `npm run dev` already boots the create-next-app template.
- F0b additionally needs the sibling API (`guideagent`) reachable at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) with `GET /openapi.json` and `GET /api/v1/health`.

## Prompt conventions (every step)

- Read `AGENTS.md` (after 0.1 exists) and the F0 locks below before writing files.
- **Extend, don't replace** the existing scaffold unless the step says replace (F0.1 retargets README / default page / `AGENTS.md`).
- **Packages at point of use** — install only what that step lists.
- **Do NOT jump ahead** to the next sub-step inside a single prompt body.
- Never invent endpoints or DTO fields. OpenAPI / `frontendGuide.md` win on wire shapes; this playbook wins on sequence and proofs.

## F0 architecture

```
app/                    existing App Router (retarget, don't recreate)
AGENTS.md               Wandr FE hard rules (0.1)
lib/config.ts           NEXT_PUBLIC_* (0.2) — throws if API URL missing
types/generated/api.d.ts  OpenAPI codegen (0.6) — never hand-edit
lib/api/client.ts       Gateway + envelope adapters (0.3)
lib/api/errors.ts       NetworkError / ApiError (0.3)
components/ui/          shadcn primitives (0.5)
providers/              QueryClient + toaster (0.4)
```

No destination search, no SSE, no map, no auth module logic. Those are F1+.

## Locked decisions

### This directory is the app — LOCKED

- Do not run `create-next-app`. Do not create `wandr-web/`.
- Guardrails go in existing `AGENTS.md`. Do **not** create `AGENT.md`.
- `wandr-web/` in the blueprint tree is illustrative.

### Type-lock before client — LOCKED

- F0.6 runs before F0.3. Do not stub `frontendGuide.md` §14 as the client’s source of truth.
- `types/generated/api.d.ts` is generated, committed, never hand-edited. Regenerate on backend DTO change (`npm run gen:types`).
- Domain files under `types/` (if any in F0) only compose/narrow generated types.

### Packages — LOCKED

| Step | Install | Do not |
|------|---------|--------|
| 0.1 | none (Next/React/TS/ESLint already present) | reinstall Next |
| 0.2 | none | dotenv package unless proven necessary |
| 0.6 | `openapi-typescript` (dev) | hand-write wire types |
| 0.3 | none (Vitest is F7.2) | scatter `fetch` |
| 0.5 | shadcn/ui primitives + `lucide-react` as needed | reinstall Tailwind v4; second design system |
| 0.4 | `@tanstack/react-query`, `sonner`, optional `next-themes` | Redux; Zustand unless a step needs it (F0 does not) |

Rejected: Redux, Better Auth/NextAuth owning sessions, Vercel AI SDK as planner client, `rehype-raw`.

### Envelope adapters — LOCKED (implement in 0.3)

Most JSON: `ApiResponse<T>` / `ErrorResponse`. Branch parsers for bare `PaginatedResponse<T>`, raw GeoJSON, HTTP 204, SSE (SSE parser is **F3**, but the gateway must not force those bodies through `ApiResponse`). See `frontendGuide.md` §6.

### Resilience (F0 slice) — LOCKED

- Default fetch budget **15–30s** via `AbortSignal` (pick 20s unless a call passes its own signal).
- `credentials: "include"` on the gateway (cookie client).
- Idempotent GET: at most **1** bounded retry on network blip. Mutations: **none**.
- Non-JSON / network → `NetworkError`. `success: false` or mapped error envelope → `ApiError(code)`.

### Forward locks (do not implement in F0)

- Auth module / `GET /auth/me` (F1)
- Destination search, RHF/Zod, debounce, 429 toast (F2)
- Planner SSE / EventSource ban / abort-integrity (F3)
- MapLibre, trip detail, markdown narrative (F4)
- Vitest, Playwright (F7)
- Zustand store logic (F3 narrative / F2 wizard)

## Failure-mode table — LOCKED (F0)

| Failure | Response this phase must implement | Lands in |
|---------|-------------------------------------|----------|
| Wrong lockfile / undocumented Node | README `engines` + npm as the package manager | 0.1 |
| Missing `NEXT_PUBLIC_API_URL` | Throw a clear config error — no silent `undefined` fetches | 0.2 |
| API down during `gen:types` | Script exits non-zero with “start the backend first”; **never** write empty/stale `api.d.ts` | 0.6 |
| Non-JSON body / network | Typed `NetworkError` | 0.3 |
| `success: false` / error envelope | Typed `ApiError(code)` | 0.3 |
| Query unhandled rejection | Errors bubble to toast boundary | 0.4 |
| Second design system | Forbidden — shadcn + Tailwind only | 0.5 |

## Feature buildup

| After | Exists | Still empty / forbidden |
|-------|--------|-------------------------|
| 0.1 | Feature-folder skeleton; Wandr rules in `AGENTS.md`; README engines; `npm run dev` boots | No `fetch` client; no env helper; no shadcn; no Query |
| 0.2 | `.env.example`; `lib/config.ts` throws if API URL missing | No gateway; no OpenAPI types |
| 0.6 | `npm run gen:types` → committed `types/generated/api.d.ts` | Client still stub; do not hand-edit generated file |
| 0.3 | Gateway + envelope parsers + health smoke | No auth/destinations/planner modules (stubs OK); no SSE parser |
| 0.5 | shadcn Button (+ toast primitive if installed) on a scratch page | No TanStack Query provider yet |
| 0.4 | QueryClient + Sonner at root layout; scratch page still works | No F1 session chrome |

## LLD / FE patterns this phase

| Pattern | Where |
|---------|--------|
| Feature folders | `features/*` (empty modules OK) |
| Codegen type boundary | `types/generated/api.d.ts` |
| API Gateway + Envelope Adapter | `lib/api/client.ts` |
| Server-state cache provider | `providers/` + root layout (0.4) |

## Recommended run batches

| Batch | Sub-steps | Proof before next |
|-------|-----------|-------------------|
| F0a | 0.1 → 0.2 | Tree + Wandr `AGENTS.md`; `npm run dev` boots; config throws without API URL |
| F0b | 0.6 → 0.3 | `gen:types` populates `api.d.ts`; health smoke; envelope fixtures parse | Requires local API |
| F0c | 0.5 → 0.4 | Button/toast on scratch page; app loads with Query + toaster |

---

## Step 0.1 — Retarget existing scaffold + directory skeleton

```
Read docs/blueprint.md (This repo box, F0.1, Project structure, AGENTS.md paste-block) and node_modules/next/dist/docs/ before writing any file.

TASK: Retarget this existing Next.js app as Wandr FE. Do NOT run create-next-app. Do NOT add a nested wandr-web/ folder. Do NOT install packages.

This is step 0.1. Stop when the tree and AGENTS.md exist and npm run dev still boots.

─── FEATURE BUILDUP ───
After this step:
  EXISTS: feature/lib/types/scripts/store/hooks/providers/tests skeleton; Wandr hard rules in AGENTS.md; README names Node/npm and points at docs/blueprint.md; default page is no longer the create-next-app marketing template.
  STILL EMPTY: lib/config.ts, lib/api/client.ts logic, OpenAPI types, shadcn, Query, any fetch to the API.

─── FAILURE MODE ───
Wrong package manager / undocumented Node → document engines in README (Node 20+, npm). Do not add yarn.lock or pnpm-lock.yaml.

─── LLD / BEST PRACTICE ───
Pattern: Feature folders + modular UI shell.
Keep the Next.js dist-docs reminder in AGENTS.md (this Next line differs from training data). Put Wandr hard rules in the same file. On-disk name is AGENTS.md — do NOT create AGENT.md.

─── WHAT TO CREATE ───

1. AGENTS.md at repo root:
   - Keep the existing Next.js docs reminder comment (or an equivalent "read node_modules/next/dist/docs/" rule).
   - Paste the fenced guardrail block from docs/blueprint.md section "AGENTS.md — FE coding guardrails" (the markdown inside the fence). That block’s heading may say AGENT.md; the file on disk is AGENTS.md.
   - Result: AGENTS.md contains Wandr FE hard rules, not only the Next.js stub.

2. Replace the create-next-app README with a short Wandr FE README:
   - This repo is the Next.js client for the Wandr API (sibling guideagent).
   - engines: Node 20+
   - package manager: npm (package-lock.json)
   - npm run dev → http://localhost:3000
   - API: copy .env.example to .env.local (F0.2 creates the example — for now say the vars will be NEXT_PUBLIC_API_URL and optional NEXT_PUBLIC_MAP_STYLE_URL)
   - Pointers: docs/blueprint.md (build bible), docs/frontendGuide.md (wire contract)
   - Do not document DATABASE_URL / Redis / LLM secrets — those are backend-only.

3. Directory skeleton. Create folders and stub modules. Stubs are a one-line comment plus `export {};` so they are valid TS. Do NOT put fetch, React Query, or UI in them.

   features/auth/index.ts          // F1
   features/destinations/index.ts  // F2
   features/planner/index.ts       // F3
   features/trips/index.ts         // F4
   lib/api/client.ts               // stub: Implemented in F0.3
   lib/api/auth.ts                 // F1
   lib/api/destinations.ts         // F2
   lib/api/places.ts               // F6
   lib/api/planner.ts              // F3
   lib/api/trips.ts                // F4
   lib/sse/planner.ts              // F3 — abortable SSE; do not implement
   lib/utils/index.ts              // empty helper barrel OK
   store/.gitkeep                  // Zustand in a later F-step, not F0
   hooks/.gitkeep
   providers/.gitkeep              // F0.4
   types/generated/.gitkeep        // F0.6 writes api.d.ts
   scripts/.gitkeep                // F0.6 writes generate script
   tests/.gitkeep                  // F7
   components/ui/.gitkeep          // F0.5 shadcn
   components/map/.gitkeep         // F4
   components/generate/.gitkeep    // F3

4. Retarget app/page.tsx to a minimal placeholder (Wandr / search comes in F2). Keep app/layout.tsx working. Do NOT add app/generate or app/trips routes yet (F3/F4).

─── RULES FOR THIS STEP ───
- No package installs. No .env.example yet (0.2). No API client logic.
- Do not delete Tailwind / app/globals.css / existing Next config.
- Do not create AGENT.md.

─── VALIDATION ───
PowerShell (repo root):

  Select-String -Path AGENTS.md -Pattern "lib/api/client.ts" | Select-Object -First 1
  # Expected: a match (Wandr hard rules present)

  Test-Path AGENT.md
  # Expected: False

  Get-ChildItem -Recurse features, lib\api, types, scripts, providers | Select-Object FullName
  # Expected: skeleton paths exist

  npm run dev
  # Expected: boots. Browser at http://localhost:3000 is no longer the stock create-next-app marketing page.
```

---

## Step 0.2 — Env example + API URL

```
Read AGENTS.md and this step before writing any file.

TASK: Add env example + a config helper that fails loud when NEXT_PUBLIC_API_URL is missing.

This is step 0.2. No new packages. Do NOT implement lib/api/client.ts (that is 0.3, after 0.6).

─── FEATURE BUILDUP ───
After this step:
  EXISTS: .env.example; lib/config.ts with getPublicApiUrl() that throws a clear error if unset; README mentions copying .env.example → .env.local.
  STILL EMPTY: gateway client, OpenAPI types, health fetch.

─── FAILURE MODE ───
Missing NEXT_PUBLIC_API_URL → throw (or return never) with message: copy .env.example to .env.local and set NEXT_PUBLIC_API_URL (no trailing slash). Never concatenate "undefined" into fetch URLs.

─── LLD / BEST PRACTICE ───
Pattern: env-swappable API — same build, only NEXT_PUBLIC_* changes.
FE env is only NEXT_PUBLIC_API_URL and optional NEXT_PUBLIC_MAP_STYLE_URL. Never DATABASE_URL, REDIS_*, LLM_*, OAuth secrets.
Strip trailing slashes on the API origin.

─── WHAT TO CREATE ───

1. .env.example (committed):

   NEXT_PUBLIC_API_URL=http://localhost:8000
   # NEXT_PUBLIC_MAP_STYLE_URL=

2. lib/config.ts:
   - getPublicApiUrl(): string — reads process.env.NEXT_PUBLIC_API_URL, trims trailing slash, throws if missing/empty.
   - getMapStyleUrl(): string | undefined — optional, no throw.
   - Do not load dotenv in the Next app (Next injects NEXT_PUBLIC_*).

3. Update README: copy .env.example to .env.local; never commit .env.local.

4. Ensure .gitignore already ignores .env*.local (create-next-app usually does). Do not gitignore .env.example.

─── RULES FOR THIS STEP ───
- No fetch. No openapi-typescript. No health call (0.3).
- Do not invent extra public env vars.

─── VALIDATION ───
  Test-Path .env.example
  Select-String -Path lib\config.ts -Pattern "NEXT_PUBLIC_API_URL"
  Select-String -Path lib\config.ts -Pattern "throw"
  # Expected: helper throws on missing URL

  # Confirm .env.local is ignored (do not print secrets):
  Select-String -Path .gitignore -Pattern "\.env\*\.local"
```

---

## Step 0.6 — OpenAPI type-lock

```
Read AGENTS.md, docs/blueprint.md F0.6, and docs/frontendGuide.md §6 + §8 before writing any file.

TASK: Generate types/generated/api.d.ts from the live OpenAPI spec. This must land BEFORE the gateway client (0.3).

This is step 0.6. Requires the local API running. Install only openapi-typescript (dev).

─── FEATURE BUILDUP ───
After this step:
  EXISTS: npm run gen:types; types/generated/api.d.ts populated and committed; README says rerun after any backend DTO/route change (same discipline as alembic upgrade head).
  STILL EMPTY: lib/api/client.ts still a stub until 0.3.

─── FAILURE MODE ───
API unreachable / OpenAPI fetch fails → process exits non-zero with a clear message including "start the backend first". Do NOT write an empty file. Do NOT leave a partial/truncated api.d.ts (write to a temp path, rename on success).

─── LLD / BEST PRACTICE ───
Pattern: Codegen type boundary.
Hand-written types in types/ are a thin domain layer ONLY. Never hand-edit generated files — regenerate.
Commit api.d.ts (reviewable diffs on drift are a feature). Do not gitignore it.
Confirm against live OpenAPI (do not invent): POST /api/v1/trips/{id}/claim and itinerary_done trip_id — if absent, note in a one-line comment in README under type-lock, do not fake fields.

─── INSTALL ───
  npm install -D openapi-typescript
  Justify in package.json by the new gen:types script (no extra commentary file required).

─── WHAT TO CREATE ───

1. Cross-platform generator so Windows npm run gen:types works (this repo is developed on PowerShell):
   - scripts/generate-api-types.mjs (canonical)
   - Optional scripts/generate-api-types.sh that calls the same node script (blueprint name).
   Behavior:
     a. Resolve NEXT_PUBLIC_API_URL from process.env, else parse .env.local then .env then .env.example (no dotenv package). Strip trailing slash.
     b. GET {origin}/openapi.json (FastAPI default path — not under /api/v1).
     c. On non-OK or network error: print "start the backend first" (and the URL tried) and exit 1. Do not write api.d.ts.
     d. Run openapi-typescript on the spec (CLI or library). Write types/generated/api.d.ts only after success.
     e. Ensure types/generated exists.

2. package.json script:
   "gen:types": "node scripts/generate-api-types.mjs"

3. README: npm run gen:types after backend DTO/route changes; API must be up; commit the diff.

─── RULES FOR THIS STEP ───
- Do not implement the gateway client.
- Do not hand-edit the generated file after it is written.
- Do not change FastAPI.

─── VALIDATION ───
  # API must already be up. In a second terminal if needed:
  # (API repo) uvicorn …  → http://localhost:8000

  npm run gen:types
  Test-Path types\generated\api.d.ts
  # Expected: file non-empty (length >> 0)

  # Loud failure (optional but recommended once): stop the API, run gen:types, expect non-zero and no wiped file.
```

---

## Step 0.3 — lib/api/client.ts — Gateway + envelopes

```
Read AGENTS.md, docs/frontendGuide.md §6 (envelopes) and §8 (health), docs/blueprint.md F0.3 + Resilience / UX Contracts.

TASK: Implement the API gateway and envelope adapters on top of generated types. Smoke GET /api/v1/health.

This is step 0.3. Types already exist from 0.6. No new packages. Do NOT install Vitest (F7.2). Do NOT implement SSE (F3) or auth/me (F1).

─── FEATURE BUILDUP ───
After this step:
  EXISTS: lib/api/client.ts (+ errors + envelope parsers); health helper; fixture JSON for success/error parse; health smoke against local API.
  STILL EMPTY: domain modules remain stubs; no EventSource; no React Query.

─── FAILURE MODE ───
- Network / CORS / non-JSON body → throw NetworkError (never an untyped Error with a useless message).
- HTTP error with ErrorResponse JSON, or success:false envelope → throw ApiError with .code and .message.
- Missing API URL → config throw from 0.2 (client must call getPublicApiUrl()).

─── LLD / BEST PRACTICE ───
Pattern: API Gateway + Envelope Adapter.
All HTTP to the API goes through this client. Never scatter raw fetch with ad-hoc URLs.
credentials: "include" on every call.
Every fetch accepts AbortSignal (or the client creates a timeout abort in 15–30s; default 20s).
Idempotent GET: at most one bounded retry on network blip. Mutations: no retry.
Branch parsers: ApiResponse<T>, ErrorResponse, bare PaginatedResponse<T>, raw JSON (GeoJSON later), HTTP 204 empty. Do not force GeoJSON/204/SSE through ApiResponse.
Prefer composing types from types/generated/api.d.ts. If generated names differ from frontendGuide.md §14, generated names win — do not redeclare fields.

─── WHAT TO CREATE ───

1. lib/api/errors.ts
   - NetworkError extends Error
   - ApiError extends Error { code: string; details?: unknown; status: number }

2. lib/api/client.ts
   - apiUrl() via getPublicApiUrl()
   - request helpers: getJson / sendJson (or equivalent) with method, path, optional body, signal, parse mode:
     "api" | "paginated" | "raw" | "empty"
   - Prefix paths: caller passes "/api/v1/health" or a helper joins origin + path. No double slashes.
   - Parse success ApiResponse; throw ApiError on error envelope / non-OK JSON error; NetworkError on parse/network failure.

3. lib/api/health.ts (tiny domain helper — allowed in F0 as smoke):
   - getHealth(signal?: AbortSignal) → GET /api/v1/health via the gateway.

4. lib/api/fixtures/success.json and error.json — realistic envelopes from frontendGuide.md §6. Parsers must accept these. F7.2 will Vitest them; for now keep parsers pure functions (export parseApiResponse / parseErrorResponse) so they are unit-testable without a test runner.

5. Replace the F0.1 stub comment in lib/api/client.ts with the real implementation.

6. Optional smoke script scripts/smoke-health.mjs that uses fetch + the same origin as .env.local to GET /api/v1/health and prints JSON — or document a PowerShell Invoke-WebRequest. Prefer a script that imports nothing from Next so it runs under node. If TS import is awkward, PowerShell smoke against the running Next app is NOT required; smoke the API origin:

   Invoke-WebRequest -Uri "$env:NEXT_PUBLIC_API_URL/api/v1/health"  (or http://localhost:8000/api/v1/health)
   Expected: JSON with success true (shape per live API).

   Also add a one-line note in README: health is GET {API}/api/v1/health.

─── RULES FOR THIS STEP ───
- Do not implement lib/sse/planner.ts.
- Do not fill auth.ts / destinations.ts with real calls yet.
- Do not add TanStack Query.
- Do not use browser EventSource.

─── VALIDATION ───
  Select-String -Path lib\api\client.ts -Pattern "credentials"
  Select-String -Path lib\api\client.ts -Pattern "AbortSignal"
  Select-String -Path lib\api\errors.ts -Pattern "class ApiError"
  Test-Path lib\api\fixtures\success.json
  Test-Path types\generated\api.d.ts
  # Client must import from generated types or from a thin types/ wrapper — not a hand-copied DTO dump of frontendGuide §14.

  Invoke-RestMethod http://localhost:8000/api/v1/health
  # Expected: success envelope (API up). Client code paths match this URL via getPublicApiUrl().
```

---

## Step 0.5 — shadcn/ui + Tailwind baseline

```
Read AGENTS.md and node_modules/next/dist/docs/ before changing the App Router tree. Read current shadcn docs for Tailwind v4 + this Next line (do not follow outdated init flags from training data).

TASK: Add shadcn/ui primitives on the existing Tailwind v4 setup. Prove Button (and toast if the primitive is part of the same init) on a scratch page.

This is step 0.5. Tailwind v4 is ALREADY present — do not reinstall it. Do not add TanStack Query (0.4).

─── FEATURE BUILDUP ───
After this step:
  EXISTS: components/ui/* from shadcn; lucide-react as needed; scratch page renders a Button.
  STILL EMPTY: QueryClient provider (0.4). Do not build search/generate screens.

─── FAILURE MODE ───
Do not invent a second design system (no MUI, Chakra, homemade Button CSS module competing with shadcn). If shadcn init wants to rewrite Tailwind in a way that breaks v4, stop and follow current shadcn + Tailwind v4 guidance rather than downgrading Tailwind.

─── LLD / BEST PRACTICE ───
Pattern: copy-in primitives under components/ui. Lightest viable package.
Scratch route: app/dev/ui/page.tsx (dev-only convenience). Do not add it to a public nav. May be removed in F7.

─── INSTALL ───
- Initialize shadcn for this repo (components.json, utils, etc.) using the current CLI compatible with Tailwind v4 / Next 16.
- Add button (required). Add sonner’s shadcn wrapper only if the CLI’s recommended toast path for this stack is a shadcn sonner component — otherwise wait for 0.4’s `sonner` package. Do not install @tanstack/react-query here.
- lucide-react as needed by shadcn.

─── WHAT TO CREATE ───

1. shadcn init + Button primitive.
2. app/dev/ui/page.tsx: client page with a Button labelled "Scratch". Keep it boring.
3. Remove components/ui/.gitkeep if real files exist.

─── RULES FOR THIS STEP ───
- Do not wrap the root layout with QueryClientProvider (0.4).
- Do not install Redux, MUI, or a theme package unless next-themes is already required by shadcn’s init — prefer leaving next-themes for 0.4 if optional.

─── VALIDATION ───
  Test-Path components.json
  Get-ChildItem components\ui
  npm run dev
  # Open http://localhost:3000/dev/ui — Button visible.
```

---

## Step 0.4 — Providers — Query + toaster

```
Read AGENTS.md, docs/blueprint.md F0.4, and current TanStack Query v5 Next.js App Router docs (client provider pattern).

TASK: Install Query + Sonner (optional next-themes). Provide them at the root layout. Query errors must not spam unhandled rejections.

This is step 0.4. Last F0 code step. Do NOT start F1 (no auth/me, no header chrome).

─── FEATURE BUILDUP ───
After this step:
  EXISTS: providers wrapping the app; Sonner toaster; optional QueryClientDevtools in dev; scratch page still works.
  STILL EMPTY: F1 session shell.

─── FAILURE MODE ───
Query errors bubble to a toast boundary — no unhandled rejection spam. Wire QueryCache/MutationCache onError (or equivalent) to toast.error with a safe message. Do not toast raw stack traces.

─── LLD / BEST PRACTICE ───
Pattern: Server-state cache provider at root layout.
TanStack Query for server/async state. Do not add Zustand in F0.
Keep the provider in a Client Component (providers/app-providers.tsx or similar) imported from app/layout.tsx.

─── INSTALL ───
  npm install @tanstack/react-query sonner
  Optional: npm install next-themes — only if you actually wire a theme provider. Skip if unused.

─── WHAT TO CREATE ───

1. providers/query-provider.tsx (or app-providers.tsx) — QueryClient with:
   - sensible defaults: no retry on mutations; queries at most 1 retry (matches gateway GET retry policy at the cache layer; do not also triple-retry in every hook later)
   - onError → sonner toast
2. Toaster from sonner in the same provider tree.
3. Optional ReactQueryDevtools in development only.
4. app/layout.tsx wraps children with the provider. Do not remove fonts/globals.
5. On the scratch page, add a tiny client button that toast("F0 scratch") so toaster proof does not depend on a failing query.

─── RULES FOR THIS STEP ───
- Do not implement GET /auth/me.
- Do not add destination search.
- Do not put server entities in a global store.

─── VALIDATION ───
  Select-String -Path app\layout.tsx -Pattern "QueryClient|AppProviders|QueryProvider"
  Select-String -Path providers -Pattern "toast" -Recurse
  npm run dev
  # App loads. /dev/ui still shows Button. Clicking the toast scratch control shows a Sonner toast.
  # No unhandledrejection noise in the console on load.
```

---

## F0 ship checklist

Do not author full F1 prompts or start F1 code until every item is green:

```
# 0.1
Test-Path AGENTS.md
Select-String -Path AGENTS.md -Pattern "credentials: `"include`""
Test-Path AGENT.md   # Expected: False
npm run dev          # boots; home is not stock create-next-app marketing

# 0.2
Test-Path .env.example
Select-String -Path lib\config.ts -Pattern "throw"

# 0.6  (API up)
npm run gen:types
Test-Path types\generated\api.d.ts

# 0.3
Select-String -Path lib\api\client.ts -Pattern "AbortSignal"
Invoke-RestMethod http://localhost:8000/api/v1/health

# 0.5
Test-Path components.json
# Browser: /dev/ui shows Button

# 0.4
Select-String -Path app\layout.tsx -Pattern "Provider"
# Browser: toast from scratch control; no unhandledrejection on load
```

All checks passing → F0 is done. Next: expand [`StepF1.md`](StepF1.md) from outline into full prompts, then run F1 batches. Do not implement F1 until that expansion exists.
