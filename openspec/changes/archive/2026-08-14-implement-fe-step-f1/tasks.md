## 1. F1a — Session probe (1.1)

Follow [`docs/steps/batches/F1a.md`](../../../docs/steps/batches/F1a.md) and the fenced prompt **Step 1.1** in [`docs/steps/StepF1.md`](../../../docs/steps/StepF1.md). No new packages. Do not add login, logout, or `SessionHeader`.

- [x] 1.1 Ensure `.env.local` exists (copy from `.env.example` if missing) with `NEXT_PUBLIC_API_URL=http://localhost:8000`. Prove the sibling API: `GET /api/v1/auth/me` is reachable (guest 200 or 401 is fine). If it is not, **stop this section** — do not stub `/me`
- [x] 1.2 Replace `lib/api/auth.ts` stub: `AUTH_ME_PATH = "/api/v1/auth/me" satisfies keyof paths`; `getMe(signal?)` via `getJson` with `parse: "api"` typed as generated `AuthMeResponse`. Do not add logout yet
- [x] 1.3 Add `features/auth/use-auth-me.ts`: `useQuery` key `["auth","me"]`, pass `AbortSignal` into `getMe`, `retry: 1`, `meta.skipErrorToast: true`. View-model: success from data; error → guest + `refetch`; pending is a small readout, not a page spinner. No Zustand
- [x] 1.4 Extend `providers/app-providers.tsx` `QueryCache.onError`: if `query.meta?.skipErrorToast`, return without toasting. Keep existing toasts for other queries and all mutations. Type meta (augmentation or narrow cast). Do not disable toasts globally
- [x] 1.5 Add a `/dev/ui` client readout using `useAuthMe` (Guest or name/email, truncated `session_id`, Reconnect when `isError`). Keep F0 Button + scratch toast. Do not change `app/layout.tsx` chrome. Barrel-export `useAuthMe` from `features/auth/index.ts`
- [x] 1.6 Run Step 1.1 validation (PowerShell `Select-String` / `Test-Path` in the prompt). Browser `/dev/ui` shows Guest (typical) or user, not a crash; Network shows `GET {API}/api/v1/auth/me` with credentials. Confirm `lib/api/auth.ts` has no `logout` yet and layout has no `SessionHeader`

## 2. F1a — Login CTA + logout (1.2)

Continue F1a. Follow the fenced prompt **Step 1.2** in `StepF1.md`. Do not add `session-header` or layout chrome. No new packages.

- [x] 2.1 Add `logout` to `lib/api/auth.ts`: `AUTH_LOGOUT_PATH = "/api/v1/auth/logout" satisfies keyof paths`; `sendJson` POST, no body, pass `signal`. Keep `getMe`. If live 200 is not `ApiResponse`, use `parse: "raw"` — do not invent a Logout DTO
- [x] 2.2 Add `features/auth/start-login.ts`: `startGoogleLogin()` uses `window.location.assign` to `${getPublicApiUrl()}/api/v1/auth/google`. No `fetch` / `getJson` / `sendJson` in that file
- [x] 2.3 Add `features/auth/use-logout.ts`: `useMutation` calling `logout`, `retry: 0`, `onSuccess` `invalidateQueries({ queryKey: ["auth", "me"] })`. Do not delete cookies from JavaScript
- [x] 2.4 On `/dev/ui`, add Login (`startGoogleLogin`) and Logout (`useLogout`) using existing Button, plus helper text that Google may return the user to the API JSON page and that polished return needs backend `FRONTEND_URL`. Export `startGoogleLogin` and `useLogout` from the auth barrel
- [x] 2.5 Run Step 1.2 validation. Login click navigates to `{API}/api/v1/auth/google` (or API error JSON). Layout still has no `SessionHeader`. **Hard stop** — do not start 1.3 in this section

## 3. F1b — Shell chrome (1.3)

Follow [`docs/steps/batches/F1b.md`](../../../docs/steps/batches/F1b.md) and the fenced prompt **Step 1.3**. Compose only — no new HTTP, no destinations search, no new packages.

- [x] 3.1 Add `features/auth/session-chip.tsx`: Guest vs user name/email from `useAuthMe`; Reconnect when `isError`. No fetch
- [x] 3.2 Add `features/auth/session-header.tsx`: brand Link to `/`, Search placeholder (Link to `/`, always enabled including guests), SessionChip, Login or Logout, short §11 helper text near Login. MUST NOT import `getJson` / `sendJson` / `getMe` or call `fetch`
- [x] 3.3 Mount `SessionHeader` above `{children}` inside `AppProviders` in `app/layout.tsx`. Do not wrap children in required-auth. Keep `/dev/ui` proof. Export `SessionHeader` from the auth barrel
- [x] 3.4 Run Step 1.3 validation: header on `http://localhost:3000` as guest; Search clickable; no `/api/v1/destinations/search` request; `lib/api/destinations.ts` still stub; `package.json` has no `next-auth` / `better-auth`

## 4. F1 ship — stop

- [x] 4.1 Run the full F1 ship checklist at the bottom of `docs/steps/StepF1.md` and confirm every item is green
- [x] 4.2 Update `docs/app/system.md` to an F1 as-built snapshot (auth module, `useAuthMe` / login / logout, header chrome, `skipErrorToast`). Confirm this change did not implement destination search, SSE, map, Zustand, Vitest, NextAuth, `/auth/done`, or expand `StepF2.md`
