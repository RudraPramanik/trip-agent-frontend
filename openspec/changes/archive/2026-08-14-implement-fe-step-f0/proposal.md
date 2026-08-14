## Why

`docs/steps/StepF0.md` and batches F0a–F0c are ready, but the Next.js app is still the create-next-app template: no Wandr guardrails, no API URL config, no generated wire types, no gateway, no providers. F1+ cannot start until this guest foundation exists. Implement F0 now, in playbook order, without inventing endpoints or jumping to search/auth/SSE.

## What Changes

- Retarget this repo as the Wandr FE (feature-folder skeleton, Wandr rules in `AGENTS.md`, README engines/npm). Do **not** run `create-next-app` or add `wandr-web/`.
- Add `.env.example` + `lib/config.ts` that throws if `NEXT_PUBLIC_API_URL` is missing; fix `.gitignore` so `.env.example` is committable.
- Switch the documented package manager to **npm** (`package-lock.json`); remove `pnpm-lock.yaml` / `pnpm-workspace.yaml` so the playbook and lockfile match.
- Generate and commit `types/generated/api.d.ts` from the live API OpenAPI spec (`npm run gen:types`); fail loud if the API is down.
- Implement `lib/api/client.ts` (envelope adapters, `credentials: "include"`, AbortSignal, typed `NetworkError` / `ApiError`) plus a health helper and parse fixtures.
- Add shadcn Button on a scratch `/dev/ui` page, then wrap the root layout with TanStack Query + Sonner (query errors toast; no unhandled-rejection spam).
- Stop at the F0 ship checklist. Do **not** implement F1 (`/auth/me`, header chrome) or expand `StepF1.md` in this change.

## Capabilities

### New Capabilities

- `core-client`: Public API origin config, OpenAPI type-lock, HTTP gateway with envelope adapters and typed errors, health smoke, and root Query/toaster providers.

### Modified Capabilities

- None. `openspec/specs/` is empty; this is the first application capability.

## Impact

- **Touched:** `AGENTS.md`, `README.md`, `app/` (placeholder home, layout providers, `/dev/ui`), `lib/config.ts`, `lib/api/*`, `types/generated/api.d.ts`, `scripts/generate-api-types.mjs`, `providers/`, `components/ui/`, `features/*` stubs, `package.json`, lockfile, `.env.example`, `.gitignore`.
- **New packages (at point of use):** `openapi-typescript` (dev, F0.6); shadcn primitives + `lucide-react` (F0.5); `@tanstack/react-query`, `sonner`, optional `next-themes` (F0.4).
- **Not touched:** FastAPI / `guideagent` routes; F1–F7 product screens; Vitest/Playwright (F7); Zustand; SSE parser.
- **Runtime dependency:** F0b (type-lock + gateway proofs) requires the sibling API at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) with Postgres up so `GET /openapi.json` and `GET /api/v1/health` succeed. F0a can land without it.
- **Follow-up:** expand `docs/steps/StepF1.md` from outline after this ship checklist is green (separate change).
