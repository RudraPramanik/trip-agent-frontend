## Context

See `proposal.md` for why. Product SSOT is `docs/blueprint.md` F0; wire contract is `docs/frontendGuide.md` §6 and §8; execution grain is `docs/steps/StepF0.md` (write) and `docs/steps/batches/F0a.md`–`F0c.md` (run). Specs: `specs/core-client/spec.md`.

This directory already is the Next.js app (16.2 / React 19 / Tailwind v4). `AGENTS.md` is still the Next.js dist-docs stub. A `pnpm-lock.yaml` exists with no `package-lock.json`; playbook lock is npm. `.gitignore` uses `.env*`, which would hide `.env.example`. Sibling API `guideagent` implements `GET /api/v1/health` as `ApiResponse` (503 `db_unavailable` if DB ping fails) and CORS defaults to `http://localhost:3000`. Health is registered with `response_model=None`, so OpenAPI may underspecify that operation.

## Goals / Non-Goals

**Goals:**
- Land F0 in playbook dependency order (not blueprint numeric order): 0.1 → 0.2 → 0.6 → 0.3 → 0.5 → 0.4.
- Make type-lock mechanical (`npm run gen:types`) before any gateway logic.
- Align lockfile and README with the playbook’s npm decision in 0.1.

**Non-Goals:**
- F1 session shell, destination search, planner SSE parser, map, Vitest/Playwright.
- Expanding `StepF1.md`–`StepF7.md` prompt bodies.
- Changing FastAPI routes or health `response_model`.
- A Next.js BFF or rewrite proxy.

## Decisions

### 1. Apply in three hard-stopped batches

Execute `docs/steps/batches/F0a.md` then `F0b.md` then `F0c.md`. Prompt bodies stay in `StepF0.md`; do not merge 0.1–0.3 into one prompt body. Stop F0b if `/openapi.json` or `/api/v1/health` is unreachable — do not stub `frontendGuide.md` §14 as the client’s source of truth.

**Alternative considered:** One apply session for all of F0. Rejected — later sub-steps get sloppy; F0b has a runtime gate the others do not.

**Alternative considered:** Blueprint numeric order (0.3 before 0.6). Rejected — forces type stubs and a backfill. StepF0 already locked type-lock first.

### 2. npm is the package manager

In 0.1: document `engines` Node 20+ and npm; add `package-lock.json`; delete `pnpm-lock.yaml` and `pnpm-workspace.yaml`. Reinstall with npm so `node_modules` matches. Do not keep two lockfiles.

**Alternative considered:** Keep pnpm and retarget the playbook. Rejected — StepF0 packages/README locks are already npm; this change implements the playbook, it does not rewrite it.

### 3. Canonical type-gen is a Node script

`scripts/generate-api-types.mjs` is canonical (`npm run gen:types` → `node scripts/generate-api-types.mjs`). Resolve origin from `process.env.NEXT_PUBLIC_API_URL`, else parse `.env.local` then `.env` then `.env.example` (no dotenv package). Write to a temp path; rename onto `types/generated/api.d.ts` only after success. Optional `.sh` wrapper may call the same Node script.

**Alternative considered:** Shell-only `npx openapi-typescript` as in the blueprint tree. Rejected — this repo is developed on PowerShell; Node is the cross-platform path StepF0 already specified.

### 4. Gateway parse modes; generated names win

`lib/api/client.ts` exposes get/send helpers with parse mode `"api" | "paginated" | "raw" | "empty"`. Default JSON calls use `"api"`. Health uses `"api"`. Export pure `parseApiResponse` / `parseErrorResponse` plus fixtures under `lib/api/fixtures/` from `frontendGuide.md` §6 (Vitest is F7). Compose types from `types/generated/api.d.ts`; if generated operation/schema names differ from §14, generated names win — do not redeclare fields. If health is missing or weakly typed in OpenAPI (`response_model=None`), parse as generic `ApiResponse` and note that in README under type-lock; do not fake a schema.

Default abort: 20s `AbortSignal`. `credentials: "include"` on every call. GET: at most one retry on network blip. Mutations: none.

**Alternative considered:** Hand-written §14 DTOs until codegen exists. Rejected — F0.6 lands first.

**Alternative considered:** Implement SSE parser “while we’re in the client.” Rejected — F3; gateway must not force SSE through `ApiResponse`.

### 5. Providers wrap layout after shadcn exists

0.5: shadcn init compatible with Tailwind v4 + this Next line; Button required; scratch `app/dev/ui/page.tsx`. Do not reinstall Tailwind. Do not add a second design system. Install shadcn’s sonner wrapper only if that is the CLI’s toast path; otherwise wait for 0.4’s `sonner` package.

0.4: `@tanstack/react-query` + `sonner` in a client `providers/` module imported from `app/layout.tsx`. QueryCache/MutationCache `onError` → `toast.error` with a safe message. Query retries at most 1; mutation retries 0 (aligned with gateway). Skip `next-themes` unless shadcn init already requires it.

**Alternative considered:** Providers before shadcn. Rejected — scratch Button should render before the tree is wrapped.

### 6. Env gitignore and empty example

Narrow `.gitignore` from `.env*` to `.env` and `.env*.local` so `.env.example` is committable. Replace the existing empty ignored `.env.example` with the playbook contents (`NEXT_PUBLIC_API_URL=http://localhost:8000`, optional map style commented).

### 7. Guardrails file is `AGENTS.md`

Paste the blueprint FE guardrail block into existing `AGENTS.md`. Keep the Next.js `node_modules/next/dist/docs/` reminder. Do not create `AGENT.md`.

## Risks / Trade-offs

- [F0b blocked because API or Postgres is down] → Mitigation: F0a is independent. F0b tasks start with PowerShell proofs of `/openapi.json` and `/api/v1/health`. Type-gen fails loud; never wipe `api.d.ts`.
- [Health omitted or untyped in OpenAPI] → Mitigation: fixtures + generic `ApiResponse` parser; README one-liner; do not invent fields.
- [shadcn init fights Tailwind v4 / Next 16] → Mitigation: follow current shadcn docs; stop rather than downgrade Tailwind or add a second UI kit.
- [Agent jumps ahead or extra packages] → Mitigation: batch hard stops; packages only at the listed step.
- [Leftover pnpm `node_modules` after lockfile switch] → Mitigation: 0.1 reinstalls with npm after deleting pnpm lockfiles.
- [CORS not exercised until a browser fetch] → Mitigation: F0b smokes the API origin via PowerShell. Browser CORS is already defaulted on the API; F1 will be the first cookie UI. Optional: scratch health button is out of scope.

## Migration Plan

Local FE only; no production deploy. Rollback = revert this change’s commits (restore create-next-app defaults and pnpm lock if needed). Operators copy `.env.example` → `.env.local` before `npm run dev` against a live API.

F0b requires, in `guideagent`: Postgres via `docker compose up -d`, then `uvicorn` on port 8000. Qdrant seed/enrich is not required for F0.

After the F0 ship checklist in `StepF0.md` is green, a separate change expands `StepF1.md`. Optionally add `docs/app/system.md` in that follow-up (playbook template expects it after F0 ships; not a blocker for this apply).

## Open Questions

None. Batch order, npm lock, type-lock-before-client, and F0b’s API+DB gate were decided in explore against the existing playbook.
