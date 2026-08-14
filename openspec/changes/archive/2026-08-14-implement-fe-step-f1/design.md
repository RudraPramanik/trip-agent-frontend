## Context

See `proposal.md` for why. Product SSOT is `docs/blueprint.md` F1; wire is `docs/frontendGuide.md` §5, §8 auth, §11 OAuth gap; execution grain is `docs/steps/StepF1.md` (write) and `docs/steps/batches/F1a.md`–`F1b.md` (run). Specs: `specs/session-shell/spec.md`, `specs/core-client/spec.md`. Built-so-far: `docs/app/system.md`.

F0 left `lib/api/auth.ts` and `features/auth/index.ts` as `export {}`. The gateway already sends `credentials: "include"`, retries GET once, and does not retry mutations. QueryCache currently toasts every query error. Generated types already include `AuthMeResponse`, `/api/v1/auth/me`, `/api/v1/auth/logout`, and `/api/v1/auth/google`. Logout 200 is typed `unknown`. Google callback still returns JSON on the API host (`frontendGuide.md` §11).

## Goals / Non-Goals

**Goals:**
- Land F1 in playbook order: 1.1 → 1.2 → 1.3, two hard-stopped batches (F1a then F1b).
- Keep HTTP, server-state, and chrome in separate modules so layout never owns fetch.
- Treat `/me` 401 as guest (no toast spam) without disabling the global toast boundary.

**Non-Goals:**
- Destination search, RHF/Zod, SSE, map, claim, Vitest/Playwright, Zustand.
- Expanding `StepF2.md`–`StepF7.md`.
- Backend `FRONTEND_URL` bounce or an `/auth/done` route.
- New npm packages.

## Decisions

### 1. Apply in two hard-stopped batches

Execute `docs/steps/batches/F1a.md` (1.1 → 1.2) then `F1b.md` (1.3). Prompt bodies stay in `StepF1.md`. Do not merge 1.1–1.3 into one prompt body. Stop F1a until `/dev/ui` shows Guest (or user), Login navigates to the API Google URL, and Logout invalidates `["auth","me"]`. Stop F1b at the F1 ship checklist.

**Alternative considered:** One apply session for all of F1. Rejected — 1.3 chrome must not own HTTP; proving the probe and login on `/dev/ui` first is the playbook’s hard stop.

**Alternative considered:** Ship only F1a (probe + login) and leave header for later. Rejected — blueprint F1 is ~1 day and the playbook already splits the risk; the product-visible shell is 1.3.

### 2. Three layers: domain HTTP, feature hooks, layout mount

```
app/layout.tsx          Server Component; mounts SessionHeader inside AppProviders
features/auth/          useAuthMe, useLogout, startGoogleLogin, SessionChip, SessionHeader
lib/api/auth.ts         getMe / logout only — mirror lib/api/health.ts
lib/api/client.ts       unchanged F0 gateway
```

- `AUTH_ME_PATH` / `AUTH_LOGOUT_PATH` `satisfies keyof paths`.
- `getMe(signal?)` → `getJson<AuthMeResponse>(..., { signal, parse: "api" })`.
- `logout(signal?)` → `sendJson` POST, no body, `retry` already 0 at gateway + Query defaults.
- Query key MUST be `["auth","me"]`. Pass the query function’s `AbortSignal` into `getMe`.
- Do not put `AuthMeResponse` in Zustand. Barrel `features/auth/index.ts` exports the public surface only.

**Alternative considered:** Fetch `/me` in `app/layout.tsx` or a root server component. Rejected — FastAPI cookies are browser-origin; layout must stay a mount point; AGENTS.md forbids auth fetch in the header.

**Alternative considered:** A global `hooks/use-auth.ts`. Rejected — playbook locks `useAuthMe` in `features/auth/`.

### 3. Login is navigation, not JSON

`startGoogleLogin()` does `window.location.assign(\`${getPublicApiUrl()}/api/v1/auth/google\`)`. No `fetch`. OAuth is a redirect (or API JSON “not configured”), not an envelope. Helper text next to Login must name the §11 gap (`FRONTEND_URL`) and that guest browsing still works.

**Alternative considered:** `getJson("/api/v1/auth/google")` or a Next rewrite proxy. Rejected — that would parse a redirect as JSON and invent a BFF.

**Alternative considered:** Implement `/auth/done` now. Rejected — backend does not bounce; faking it hides the gap.

### 4. Logout parse mode and invalidation

OpenAPI types logout 200 as `unknown`. Prefer `parse: "api"` if the live body is `ApiResponse`; otherwise `parse: "raw"`. Do not invent a Logout DTO. On mutation success: `queryClient.invalidateQueries({ queryKey: ["auth", "me"] })`. Do not `document.cookie` / delete `wandr_session` from JS (`wandr_session` remaining after logout is expected).

**Alternative considered:** Treat logout as HTTP 204 `empty`. Rejected — generated spec says 200 JSON unknown; branch on the live body once, document if `raw`.

### 5. `skipErrorToast` is a Query meta opt-out, not a global mute

In 1.1, `useAuthMe` sets `meta: { skipErrorToast: true }` and `retry: 1`. Extend `QueryCache.onError` in `providers/app-providers.tsx`: if that flag is set, return without toasting. Type meta with a module augmentation or a narrow cast. Keep mutation toasts. View-model: success uses `is_guest` / `user` / `session_id`; error maps to guest + `isError` + `refetch`; pending is a small “Checking session…” on the readout, not a full-page spinner.

**Alternative considered:** Disable QueryCache toasts entirely during F1. Rejected — logout and later search 429 still need the boundary.

**Alternative considered:** Toast on 401 then immediately show Guest. Rejected — 401 on `/me` is the normal guest path; playbook forbids toast spam.

### 6. Proof on `/dev/ui`, then product header

1.1/1.2 add readout + Login/Logout on `app/dev/ui/page.tsx` using existing Button. 1.3 adds `session-chip.tsx` / `session-header.tsx` and mounts the header above `{children}` inside `AppProviders`. Keep `/dev/ui` as a proof page. Search: Next.js `Link` to `/` labelled Search — always enabled, including guests. No `<input>` that fires destinations search.

**Alternative considered:** Skip `/dev/ui` and put Login only in the header. Rejected — then 1.2 cannot prove logout/login without also shipping chrome; playbook separates those proofs.

## Risks / Trade-offs

- [Sibling API or `.env.local` missing] → Mitigation: F1a tasks start with copy `.env.example` → `.env.local` and `Invoke-WebRequest` / `Invoke-RestMethod` against `/api/v1/auth/me`. Stop the batch if the API is down; do not stub `/me`.
- [Google OAuth not configured] → Mitigation: Login still navigates; helper text covers JSON / not-configured. Guest path remains the F1 proof.
- [CORS / cookie not sent cross-origin] → Mitigation: gateway already `credentials: "include"`; API CORS defaults include `http://localhost:3000`. If `/me` 401-loops with no `wandr_session`, record it — do not set cookies from JS.
- [Logout body is not `ApiResponse`] → Mitigation: Decision 4; use `raw` if parse `api` throws on a 200.
- [Agent jumps to F2 or adds NextAuth] → Mitigation: batch hard stops; packages table is empty; ship checklist forbids `next-auth` / `better-auth` and destinations search.
- [Query retry + gateway retry stacks into a long spinner] → Mitigation: Query `retry: 1` only; pending UI is a small readout, not a blocking gate.

## Migration Plan

Local FE only. Operators need `.env.local` (`NEXT_PUBLIC_API_URL=http://localhost:8000`) and the sibling API (Postgres + uvicorn) so `/api/v1/auth/me` answers. Google client env on the API is optional for this phase.

Rollback = revert this change’s commits (auth stubs and layout without `SessionHeader` return). No production deploy, no cookie migration.

After the F1 ship checklist in `StepF1.md` is green, update `docs/app/system.md` to the F1 as-built snapshot. A separate change expands `StepF2.md`.

## Open Questions

None. Batch split, login-as-navigation, `skipErrorToast`, guest Search placeholder, and the OAuth JSON gap are locked in `StepF1.md`.
