# Wandr — F1 Cursor prompts: Session shell

> Blueprint: [`docs/blueprint.md`](../blueprint.md) — Phase F1 (~1 day · cookie client)
> Wire contract: [`docs/frontendGuide.md`](../frontendGuide.md) §5, §8 auth, §11 OAuth gap
> Guardrails: [`AGENTS.md`](../../AGENTS.md)
> Built-so-far: [`docs/app/system.md`](../app/system.md)
> Runner: [`README.md`](README.md)
>
> One prompt per sub-step. Paste **one** fence into Agent mode, or run a batch file under [`batches/`](batches/).
> Do not start the next prompt until the current validation passes.

**Run order is numeric:** **1.1 → 1.2 → 1.3**.

| Batch | File | Sub-steps |
|-------|------|-----------|
| F1a | [`batches/F1a.md`](batches/F1a.md) | 1.1 → 1.2 |
| F1b | [`batches/F1b.md`](batches/F1b.md) | 1.3 |

---

## How to use these prompts

1. Workspace root is this repo (`guideagent-frontend`). It **is** the Next.js app.
2. Read `node_modules/next/dist/docs/` before writing App Router code (this Next line has breaking changes vs training data).
3. Run one batch **or** paste one fence — not this whole file.
4. Validation is PowerShell-first.
5. If the agent adds packages, skips a failure boundary, puts fetch in the header, or starts the next sub-step: stop and correct.

## Prerequisites (F0 must be complete)

- F0 ship checklist in [`StepF0.md`](StepF0.md) is green (gateway, generated types, Query + toaster, Wandr `AGENTS.md`).
- `lib/api/auth.ts` and `features/auth/index.ts` are still stubs (`export {}`).
- F1a needs the sibling API at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) with `GET /api/v1/auth/me` reachable.

## Prompt conventions (every step)

- First line of every prompt: read `AGENTS.md` and the F1 locks below.
- **Extend, don't replace** F0 code unless the step says replace.
- **Packages at point of use** — F1 installs **none**.
- **PowerShell-first** validation (`Select-String`, `Get-ChildItem`).
- **Do NOT jump ahead** to the next sub-step inside a single prompt body.
- Never invent endpoints or DTO fields. OpenAPI / `types/generated/api.d.ts` win on wire shapes; this playbook wins on sequence, layers, and proofs.

## F1 architecture

```
lib/api/auth.ts                  HTTP only: getMe (1.1), logout (1.2)
                                 generated paths + AuthMeResponse
                                 AbortSignal; credentials via gateway
                                 mirror lib/api/health.ts

features/auth/use-auth-me.ts     Query key ["auth","me"]
features/auth/use-logout.ts      mutation; invalidate ["auth","me"]
features/auth/start-login.ts     location.assign to {API}/api/v1/auth/google
                                 (NOT fetch / NOT the JSON gateway)

features/auth/session-chip.tsx   Guest vs user presentation (1.3)
features/auth/session-header.tsx brand + chip + login/logout + search placeholder
features/auth/index.ts           public barrel only

app/dev/ui/page.tsx              1.1/1.2 proof readout (keep; not the product header)
app/layout.tsx                   1.3 mounts SessionHeader inside AppProviders
                                 no auth fetch, no Query keys
```

FastAPI owns auth. The FE is a cookie client. Guest path stays unblocked.

## Locked decisions

### Cookie client — LOCKED

- FastAPI sets httpOnly `wandr_session` (guest) and `wandr_token` (after Google). FE never stores tokens in `localStorage`, `sessionStorage`, or readable JS cookies.
- Learn guest vs user only via `GET /api/v1/auth/me` through `lib/api/auth.ts` → `lib/api/client.ts`.
- No Better Auth, NextAuth, or a Next.js BFF that owns sessions.

### Modular layers — LOCKED

- HTTP stays in `lib/api/auth.ts`. Hooks and chrome stay in `features/auth/`. Layout only mounts.
- `useAuthMe` lives in `features/auth/`, not a global `hooks/` dump.
- Do not put `AuthMeResponse` in Zustand. Server/async state is TanStack Query only.
- Wire types from `types/generated/api.d.ts` (`AuthMeResponse`, path keys). Do not hand-mirror `frontendGuide.md` §14.
- Login is the one non-gateway exception: browser navigation, not `getJson`.

### Packages — LOCKED

| Step | Install | Do not |
|------|---------|--------|
| 1.1 | none | NextAuth, Better Auth, axios, jwt-decode |
| 1.2 | none | OAuth helper packages |
| 1.3 | none | RHF, Zod, destinations search deps |

### Login / logout — LOCKED (implement in 1.2)

- Login: `window.location.assign(`${getPublicApiUrl()}/api/v1/auth/google`)`.
- Logout: `POST /api/v1/auth/logout` via `sendJson` (no retry); then `invalidateQueries({ queryKey: ["auth", "me"] })`.
- `wandr_token` clears; `wandr_session` may remain — expected. Do not delete cookies from JS.
- OAuth success may land on the **API JSON page** (`frontendGuide.md` §11). Helper text must say so. Do not implement `/auth/done` or a `FRONTEND_URL` bounce.

### Search placeholder — LOCKED (implement in 1.3)

- Header Search is **enabled for guests** (not hidden, not `disabled={isGuest}`).
- MUST NOT call `GET /destinations/search`, debounce, or install RHF/Zod. A `Link` to `/` labeled Search is enough. F2 replaces it.

### Guest browsing — LOCKED

- No route guards. Home, `/dev/ui`, and the Search control stay reachable while guest.
- `/me` 401 is guest UI, not a login wall.

### Forward locks (do not implement in F1)

- Destination search, RHF/Zod, debounce, 429 toast (F2)
- Planner SSE / EventSource ban / abort-integrity (F3)
- MapLibre, trip detail, markdown narrative (F4)
- Claim / trip list (F5)
- Vitest, Playwright (F7)
- Zustand store logic
- `FRONTEND_URL` OAuth bounce (backend follow-up)

## Failure-mode table — LOCKED (F1)

| Failure | Response this phase must implement | Lands in |
|---------|-------------------------------------|----------|
| `/me` network blip | Gateway GET retry (already) + at most one Query retry; then guest fallback + reconnect `refetch` | 1.1 |
| `/me` 401 | Guest UI (`is_guest: true`, `user: null`); **no toast spam** (`skipErrorToast` or equivalent) | 1.1 |
| `/me` 5xx / network after retry | Guest UI + reconnect; existing QueryCache may toast once for non-401 | 1.1 |
| OAuth success lands on API JSON | Helper text next to Login CTA; guest path still works | 1.2 |
| Logout failure | Mutation error toast (existing boundary); stay on current chip until `/me` refetches | 1.2 |
| Guest vs login-gated chrome | Header + Search visible while guest; no auth wrapper on routes | 1.3 |

## Feature buildup

| After | Exists | Still empty / forbidden |
|-------|--------|-------------------------|
| 1.1 | `getMe` in `lib/api/auth.ts`; `useAuthMe`; `/dev/ui` shows Guest or user; 401/5xx → guest + reconnect | No login/logout; no header; no destinations |
| 1.2 | `logout` in `lib/api/auth.ts`; `useLogout`; `startGoogleLogin`; `/dev/ui` Login/Logout + §11 helper text | No `session-header`; no NextAuth; no cookie-from-JS |
| 1.3 | `SessionHeader` in root layout: brand, chip, login/logout, Search placeholder | No `GET /destinations/search`; header has no `fetch`/`getJson`/`getMe` |

## LLD / FE patterns this phase

| Pattern | Where |
|---------|--------|
| Cookie session probe | `GET /auth/me` via `lib/api/auth.ts` + `useAuthMe` |
| Domain modules | `lib/api/auth.ts` (HTTP only) |
| Server-state cache | Query key `["auth","me"]`; invalidate on logout |
| Feature folders | `features/auth/*` |

## Recommended run batches

| Batch | Sub-steps | Proof before next |
|-------|-----------|-------------------|
| F1a | 1.1 → 1.2 | `/dev/ui` shows Guest (or user); Login navigates to API Google URL; Logout invalidates `["auth","me"]` | Requires local API |
| F1b | 1.3 | Header on every page; Search reachable as guest; no destinations fetch |

---

## Step 1.1 — `lib/api/auth.ts` + `useAuthMe`

```
Read AGENTS.md, docs/app/system.md, docs/steps/StepF1.md (locks + this step), docs/frontendGuide.md §5 and §8 auth, and node_modules/next/dist/docs/ before writing any file.

TASK: Implement the cookie session probe. GET /api/v1/auth/me through the F0 gateway. Show Guest (or user) on /dev/ui. 401/5xx/network must not crash the app.

This is step 1.1. Do NOT add login, logout, or the product header. No new packages.

─── FEATURE BUILDUP ───
After this step:
  EXISTS: getMe in lib/api/auth.ts; useAuthMe in features/auth/; Query key ["auth","me"]; /dev/ui readout (guest/user + truncated session_id); skipErrorToast (or equivalent) so 401 does not toast-spam; guest fallback + reconnect.
  STILL EMPTY: logout, start-login, session-header, destinations search.

─── FAILURE MODE ───
- Network blip: rely on gateway GET retry; Query retry at most 1 (do not stack into a long spinner). Then treat as guest and show a reconnect control that calls refetch.
- 401: guest UI (is_guest true, user null). Do NOT toast. Honor query.meta.skipErrorToast in providers/app-providers.tsx QueryCache.onError (401 on this probe is not a product failure).
- 5xx / remaining network: guest UI + reconnect. Existing QueryCache may toast once for non-401. Never unmount the app. Never a login wall.

─── LLD / BEST PRACTICE ───
Pattern: Cookie session probe + Domain module + Server-state cache.
Mirror lib/api/health.ts: path satisfies keyof paths; getJson with signal; parse "api".
Type the payload as components["schemas"]["AuthMeResponse"] from types/generated/api.d.ts.
Query key MUST be ["auth","me"] (tuple). Pass the Query function's AbortSignal into getMe.

─── WHAT TO CREATE ───

1. lib/api/auth.ts — replace the F1 stub:
   - AUTH_ME_PATH = "/api/v1/auth/me" satisfies keyof paths
   - getMe(signal?: AbortSignal): Promise<AuthMeResponse> via getJson(..., { signal, parse: "api" })
   - Do NOT add logout yet.

2. features/auth/use-auth-me.ts ("use client"):
   - useQuery({ queryKey: ["auth", "me"], queryFn: ({ signal }) => getMe(signal), retry: 1, meta: { skipErrorToast: true } })
   - Export a view-model the UI can use without crashing:
     - success: is_guest / user / session_id from data
     - error: is_guest true, user null, plus isError + refetch for reconnect
     - pending: do not infinite-spin the whole page; a small "Checking session…" on the readout is enough
   - Do not store the result in Zustand.

3. providers/app-providers.tsx — QueryCache.onError: if query.meta?.skipErrorToast, return without toasting. Keep existing toast for other queries. Type meta if needed (module augmentation or a narrow cast). Do not disable toasts globally.

4. app/dev/ui/page.tsx — keep Button + F0 scratch toast. Add a small client readout using useAuthMe: "Guest" or user name/email, truncated session_id, and a Reconnect button when isError. Do not add Login/Logout yet. Do not put this chrome in app/layout.tsx.

5. features/auth/index.ts — barrel: export useAuthMe (and types if useful). Do not export a kitchen-sink object.

─── RULES FOR THIS STEP ───
- Do NOT jump ahead to step 1.2 (no logout, no Google redirect).
- Do NOT add session-header or change app/layout.tsx chrome.
- Do NOT fetch from features/auth except through lib/api/auth.ts.
- Do NOT install packages. Do NOT add NextAuth / Better Auth.
- Do NOT call GET /destinations/search.

─── VALIDATION ───
  Select-String -Path lib\api\auth.ts -Pattern "auth/me"
  Select-String -Path lib\api\auth.ts -Pattern "logout"   # Expected: no matches yet
  Select-String -Path features\auth -Pattern 'auth","me"|auth", "me"' -Recurse
  Select-String -Path providers\app-providers.tsx -Pattern "skipErrorToast"
  Select-String -Path app\dev\ui\page.tsx -Pattern "useAuthMe"
  Select-String -Path app\layout.tsx -Pattern "SessionHeader|session-header"   # Expected: no matches
  Test-Path features\auth\use-auth-me.ts

  npm run dev
  # Browser: http://localhost:3000/dev/ui shows Guest (typical) or user — not a crash.
  # Network: GET {API}/api/v1/auth/me with credentials. wandr_session may appear as httpOnly (Application → Cookies on API origin).
  # Optional: stop the API, reload /dev/ui — still Guest + Reconnect, no unhandledrejection loop.
```

---

## Step 1.2 — Login CTA + logout

```
Read AGENTS.md, docs/app/system.md, docs/steps/StepF1.md (locks + this step), docs/frontendGuide.md §5, §8, and §11 before writing any file.

TASK: Add logout through the gateway and a Login control that navigates to Google on the API. Document the OAuth return gap. Proof stays on /dev/ui.

This is step 1.2. Do NOT add the product header (that is 1.3). No new packages.

─── FEATURE BUILDUP ───
After this step:
  EXISTS: logout in lib/api/auth.ts; useLogout; startGoogleLogin (location.assign); /dev/ui Login + Logout + helper text that OAuth may land on API JSON.
  STILL EMPTY: session-header.tsx; no layout chrome; no destinations search.

─── FAILURE MODE ───
- OAuth success may leave the user on the API host JSON page (frontendGuide.md §11). CTA helper text must say login return is incomplete until FRONTEND_URL bounce exists. Do not pretend bounce works. Do not block guest use of the app.
- Logout mutation failure → existing Query/Mutation toast; do not clear UI as if logout succeeded until /me refetches.
- Do not delete cookies from JavaScript. After logout, wandr_session may remain — expected. /me should show guest.

─── LLD / BEST PRACTICE ───
Pattern: Cookie session probe (invalidate on logout).
Login is browser navigation to GET {API}/api/v1/auth/google — NOT getJson, NOT sendJson, NOT fetch. OAuth is a redirect (or a JSON "not configured" page), not an envelope.
Logout: sendJson POST /api/v1/auth/logout (no body). Gateway already credentials-include and does not retry mutations. OpenAPI types the 200 body as unknown — parse "api" if the live body is an ApiResponse; otherwise "raw". Do not invent a Logout DTO. Then queryClient.invalidateQueries({ queryKey: ["auth", "me"] }).

─── WHAT TO CREATE ───

1. lib/api/auth.ts — add:
   - AUTH_LOGOUT_PATH = "/api/v1/auth/logout" satisfies keyof paths
   - logout(signal?: AbortSignal) via sendJson (method POST, signal). Keep getMe.

2. features/auth/start-login.ts:
   - startGoogleLogin() { window.location.assign(`${getPublicApiUrl()}/api/v1/auth/google`) }
   - No fetch. Import getPublicApiUrl from lib/config.ts.

3. features/auth/use-logout.ts ("use client"):
   - useMutation that calls logout, onSuccess invalidate ["auth","me"]
   - retry: 0 (mutations already 0 at QueryClient defaults)

4. app/dev/ui/page.tsx — add Login (calls startGoogleLogin) and Logout (useLogout) using existing Button. Next to Login, helper text: Google may return you to the API JSON page; guest browsing still works; polished return needs backend FRONTEND_URL. Show Logout when not guest; Login when guest (or show both for proof — but never hide the rest of the page).

5. features/auth/index.ts — also export startGoogleLogin and useLogout.

─── RULES FOR THIS STEP ───
- Do NOT jump ahead to step 1.3 (no session-header, no app/layout.tsx chrome).
- Do NOT implement /auth/done or a Next rewrite that fakes the bounce.
- Do NOT use getJson("/api/v1/auth/google").
- Do NOT install packages. Do NOT add NextAuth.
- Do NOT document a fake "you are logged in" state without /me.

─── VALIDATION ───
  Select-String -Path lib\api\auth.ts -Pattern "auth/logout"
  Select-String -Path features\auth\start-login.ts -Pattern "location.assign"
  Select-String -Path features\auth\start-login.ts -Pattern "getJson|sendJson|fetch\("   # Expected: no matches
  Select-String -Path features\auth\use-logout.ts -Pattern "invalidateQueries"
  Select-String -Path app\dev\ui\page.tsx -Pattern "FRONTEND_URL|JSON"
  Select-String -Path app\layout.tsx -Pattern "SessionHeader|session-header"   # Expected: no matches

  npm run dev
  # Browser /dev/ui: Login click navigates off-origin to {API}/api/v1/auth/google (or API error JSON if Google is not configured).
  # Logout (if you have a session): Network POST /api/v1/auth/logout with credentials; /me refetches; chip/readout shows Guest.
```

---

## Step 1.3 — Shell chrome

```
Read AGENTS.md, docs/app/system.md, docs/steps/StepF1.md (locks + this step), and node_modules/next/dist/docs/ before writing any file.

TASK: Add a minimal session header: brand, guest/user chip, login/logout, Search placeholder reachable as guest. Compose feature exports only — no new HTTP.

This is step 1.3. Last F1 code step. Do NOT start F2 (no destination search). No new packages.

─── FEATURE BUILDUP ───
After this step:
  EXISTS: session-chip.tsx; session-header.tsx; layout mounts SessionHeader inside AppProviders; Search control visible while guest.
  STILL EMPTY: GET /destinations/search; RHF/Zod; SSE; map; route guards.

─── FAILURE MODE ───
- Guest browsing blocked by a login wall or by hiding Search → forbidden. Search must not be disabled={isGuest} or wrapped in "if (!is_guest)".
- Header that calls getMe / getJson / fetch → forbidden. It uses useAuthMe / startGoogleLogin / useLogout only.
- Missing AuthMeResponse.user fields → show Guest or email/name that exist; never invent avatar fetching from a new endpoint.

─── LLD / BEST PRACTICE ───
Pattern: Feature folders + Cookie session probe (UI).
SessionHeader is a client component. Root layout stays a Server Component that imports it. Mount inside AppProviders (already wrapping body) so Query hooks work.
Reuse shadcn Button. Brand can be a Link to /. Keep chrome minimal — not a marketing site.

─── WHAT TO CREATE ───

1. features/auth/session-chip.tsx — presents Guest vs user name/email from useAuthMe. Reconnect control when isError. No fetch.

2. features/auth/session-header.tsx — row: brand (Wandr → /), Search placeholder, SessionChip, Login or Logout.
   - Search: Next.js Link to "/" (or a button that does not submit). Label "Search". Always enabled, including for guests. No input that fires GET /destinations/search. No debounce. No q= min-length logic.
   - Login / Logout: same behavior as 1.2 (startGoogleLogin / useLogout). Keep the §11 helper text near Login (short is fine).
   - MUST NOT import getJson, sendJson, getMe, or call fetch.

3. app/layout.tsx — render SessionHeader above {children} inside AppProviders. Do not remove fonts/globals. Do not add auth checks around children.

4. features/auth/index.ts — export SessionHeader (and chip if useful).

5. Leave /dev/ui readout in place (dev proof). Do not replace /dev/ui with the product header.

─── RULES FOR THIS STEP ───
- Do NOT implement destination search, readiness, or compose.
- Do NOT add Zustand.
- Do NOT wrap routes in required-auth.
- Do NOT install packages.
- Do NOT jump ahead to F2.

─── VALIDATION ───
  Test-Path features\auth\session-header.tsx
  Test-Path features\auth\session-chip.tsx
  Select-String -Path app\layout.tsx -Pattern "SessionHeader"
  Select-String -Path features\auth\session-header.tsx -Pattern "fetch\(|getJson|sendJson|getMe"   # Expected: no matches
  Select-String -Path features\auth\session-header.tsx -Pattern "Search"
  Select-String -Path lib\api\destinations.ts -Pattern "search"   # Expected: still stub / no search call
  Select-String -Path package.json -Pattern "next-auth|better-auth"   # Expected: no matches

  npm run dev
  # Browser: http://localhost:3000 shows header (brand, Search, Guest + Login typical).
  # Search is clickable while Guest. Home still loads. /dev/ui still loads.
  # No request to /api/v1/destinations/search in Network on load or Search click.
```

---

## F1 ship checklist

Do not author full F2 prompts or start F2 code until every item is green:

```
# 1.1
Select-String -Path lib\api\auth.ts -Pattern "auth/me"
Select-String -Path features\auth -Pattern 'auth","me"|auth", "me"' -Recurse
# Browser /dev/ui: Guest or user; optional reconnect when API down

# 1.2
Select-String -Path lib\api\auth.ts -Pattern "auth/logout"
Select-String -Path features\auth\start-login.ts -Pattern "location.assign"
# Browser: Login leaves the app toward {API}/api/v1/auth/google; helper text mentions incomplete return

# 1.3
Select-String -Path app\layout.tsx -Pattern "SessionHeader"
Select-String -Path features\auth\session-header.tsx -Pattern "fetch\(|getJson|getMe"   # Expected: no matches
# Browser: header visible as guest; Search not login-gated; no destinations/search request

# Guard
Test-Path AGENT.md   # Expected: False
Select-String -Path package.json -Pattern "next-auth|better-auth"   # Expected: no matches
```

All checks passing → F1 is done. Next: expand [`StepF2.md`](StepF2.md) from outline into full prompts, then run F2 batches. Do not implement F2 until that expansion exists.
