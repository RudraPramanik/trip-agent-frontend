## Why

F0 shipped the guest foundation (gateway, generated types, Query + toaster), and `docs/steps/StepF1.md` is a full playbook, but the app still has stub `lib/api/auth.ts` / `features/auth/` and no session chrome. Guests cannot see who they are, cannot start Google login, and cannot logout. Implement F1 now so later destination search (F2) sits under a cookie-aware shell without inventing a Next.js session owner.

## What Changes

- Fill `lib/api/auth.ts` as an HTTP-only domain module: `GET /api/v1/auth/me` (`getMe`) then `POST /api/v1/auth/logout` (`logout`), both through the F0 gateway with `AbortSignal`. Mirror `lib/api/health.ts`. Types from `types/generated/api.d.ts` (`AuthMeResponse`, path keys).
- Add `features/auth/use-auth-me.ts` (Query key `["auth","me"]`, retry 1, guest fallback on 401/5xx/network, reconnect via `refetch`). Honor `query.meta.skipErrorToast` in `providers/app-providers.tsx` so `/me` 401 does not toast-spam.
- Add `features/auth/start-login.ts` (`location.assign` to `{API}/api/v1/auth/google` — not `getJson`) and `features/auth/use-logout.ts` (mutation, `retry: 0`, invalidate `["auth","me"]`). Proof Login/Logout + OAuth-gap helper text on `/dev/ui`.
- Add `SessionChip` + `SessionHeader` (brand, guest-enabled Search placeholder `Link` to `/`, login/logout). Mount `SessionHeader` in `app/layout.tsx` inside `AppProviders`. Header MUST NOT fetch.
- Stop at the F1 ship checklist. Do **not** implement destination search, RHF/Zod, SSE, map, claim, NextAuth/Better Auth, cookie-from-JS, `/auth/done`, or a `FRONTEND_URL` bounce.

## Capabilities

### New Capabilities

- `session-shell`: Cookie session probe (`GET /auth/me`), Google login as browser navigation, logout through the gateway with cache invalidation, and guest-unblocked header chrome (brand, chip, Search placeholder). FastAPI owns sessions; the FE is a cookie client.

### Modified Capabilities

- `core-client`: Root Query error toasts MUST skip when a query opts out via `meta.skipErrorToast` (session probe 401 is guest, not a product failure). Other queries keep the existing toast boundary.

## Impact

- **Touched:** `lib/api/auth.ts`, `features/auth/*`, `providers/app-providers.tsx`, `app/dev/ui/page.tsx`, `app/layout.tsx`, `docs/app/system.md` (F1 as-built snapshot at ship).
- **Not touched:** `lib/api/destinations.ts` / search, planner SSE, trips, map, Zustand, Vitest/Playwright, `package.json` dependencies, FastAPI / `FRONTEND_URL`, `AGENTS.md` hard rules (already cover cookie client).
- **APIs / deps:** none new. Uses existing `getJson` / `sendJson`, TanStack Query, Sonner, shadcn Button. Wire: `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`, navigate to `GET /api/v1/auth/google`.
- **Runtime dependency:** F1a proofs need the sibling API at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) with `GET /api/v1/auth/me` reachable, plus `.env.local` copied from `.env.example`. Google OAuth need not be configured — Login may land on API JSON / not-configured; helper text covers that (`frontendGuide.md` §11).
- **Follow-up:** expand `docs/steps/StepF2.md` from outline after this ship checklist is green (separate change). Backend `FRONTEND_URL` bounce is out of this repo.
