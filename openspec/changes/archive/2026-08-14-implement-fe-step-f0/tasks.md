## 1. F0a — Scaffold + env (0.1 → 0.2)

Follow [`docs/steps/batches/F0a.md`](../../../docs/steps/batches/F0a.md) and the fenced prompts in [`docs/steps/StepF0.md`](../../../docs/steps/StepF0.md). No new packages except regenerating the npm lockfile. Do not start 0.6 / 0.3 / 0.5 / 0.4.

- [x] 1.1 Switch package manager to npm: delete `pnpm-lock.yaml` and `pnpm-workspace.yaml`, add `package.json` `engines` (Node 20+), run `npm install` so `package-lock.json` exists, and confirm no second lockfile
- [x] 1.2 Paste the blueprint FE guardrail block into existing `AGENTS.md`; keep the Next.js `node_modules/next/dist/docs/` reminder; do not create `AGENT.md`
- [x] 1.3 Add the F0.1 directory skeleton (feature/lib/types/scripts/store/hooks/providers/tests stubs). Stubs are a one-line comment plus `export {};`. No fetch, Query, or UI in them
- [x] 1.4 Replace create-next-app `README.md` (Node 20+, npm, pointers to blueprint + frontendGuide, no backend secrets) and retarget `app/page.tsx` to a minimal Wandr placeholder. Do not add `/generate` or `/trips` routes
- [x] 1.5 Run F0.1 validation: `AGENTS.md` contains Wandr rules (`lib/api/client.ts`); `AGENT.md` does not exist; `npm run dev` boots; home is not the stock marketing page
- [x] 1.6 Narrow `.gitignore` from `.env*` to `.env` and `.env*.local`; write `.env.example` (`NEXT_PUBLIC_API_URL=http://localhost:8000`, optional map style commented)
- [x] 1.7 Add `lib/config.ts` with `getPublicApiUrl()` (trim trailing slash, throw if missing/empty) and `getMapStyleUrl()` (optional). Update README: copy `.env.example` → `.env.local`; never commit `.env.local`
- [x] 1.8 Run F0.2 validation (`.env.example` exists and is not ignored; config throws; `.gitignore` matches `.env*.local`)

## 2. F0b — Type-lock then gateway (0.6 → 0.3)

Follow [`docs/steps/batches/F0b.md`](../../../docs/steps/batches/F0b.md). **Hard stop** until the sibling API is up (Postgres + uvicorn). Do not stub `frontendGuide.md` §14. Do not install Vitest. Do not implement SSE or `/auth/me`.

- [x] 2.1 Prove API before codegen: `Invoke-RestMethod http://localhost:8000/openapi.json` and `Invoke-RestMethod http://localhost:8000/api/v1/health` succeed (success envelope, not 503). If either fails, stop this section
- [x] 2.2 Install `openapi-typescript` (dev only). Add `scripts/generate-api-types.mjs` (env resolution, GET `{origin}/openapi.json`, write temp then rename, exit 1 with “start the backend first” on failure) and `"gen:types": "node scripts/generate-api-types.mjs"`
- [x] 2.3 Run `npm run gen:types`; commit non-empty `types/generated/api.d.ts`; document regenerate-after-DTO-change in README. If `POST /trips/{id}/claim` or `itinerary_done.trip_id` is absent from OpenAPI, note it — do not fake fields
- [x] 2.4 Implement `lib/api/errors.ts` (`NetworkError`, `ApiError` with `code` / `message` / `status`) and `lib/api/client.ts` (origin from `getPublicApiUrl()`, `credentials: "include"`, AbortSignal default 20s, GET at most one network retry, mutations none, parse modes `api` | `paginated` | `raw` | `empty`)
- [x] 2.5 Export pure `parseApiResponse` / `parseErrorResponse`; add `lib/api/fixtures/success.json` and `error.json` from `frontendGuide.md` §6. Compose types from generated `api.d.ts`; generated names win on drift
- [x] 2.6 Add `lib/api/health.ts` `getHealth` → `GET /api/v1/health` via the gateway (`api` parse mode). If OpenAPI underspecifies health, parse as generic `ApiResponse` and note it in README
- [x] 2.7 Run F0.3 validation (`credentials`, `AbortSignal`, `ApiError`, fixtures, generated types imported, health smoke against local API)

## 3. F0c — shadcn then providers (0.5 → 0.4)

Follow [`docs/steps/batches/F0c.md`](../../../docs/steps/batches/F0c.md). Do not reinstall Tailwind. Do not implement F1 chrome. Read current shadcn docs for Tailwind v4 + this Next line before init.

- [x] 3.1 Initialize shadcn (`components.json`, `components/ui`); add Button (+ lucide as needed). Do not add a second design system. Skip `next-themes` unless init requires it
- [x] 3.2 Add `app/dev/ui/page.tsx` with a Button labelled "Scratch". Remove `components/ui/.gitkeep` if real files exist. Prove `/dev/ui` in the browser
- [x] 3.3 Install `@tanstack/react-query` and `sonner`. Add a client provider (QueryClient: query retry ≤ 1, mutation retry 0; QueryCache/MutationCache `onError` → safe `toast.error`; Toaster; optional ReactQueryDevtools in dev). Wrap `app/layout.tsx`
- [x] 3.4 Add a scratch toast control on `/dev/ui`. Prove: app loads, Button still visible, toast fires, no unhandled-rejection noise on idle load

## 4. F0 ship — stop

- [x] 4.1 Run the full F0 ship checklist at the bottom of `docs/steps/StepF0.md` and confirm every item is green
- [x] 4.2 Confirm this change did not implement F1 (`GET /auth/me`, header chrome, login CTA), did not expand `StepF1.md` prompts, and did not add Vitest, Zustand, or an SSE parser
