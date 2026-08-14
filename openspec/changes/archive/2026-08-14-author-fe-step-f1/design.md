## Context

See `proposal.md` for why. `docs/blueprint.md` (F1) remains the product SSOT. Wire contract is `docs/frontendGuide.md` §5, §8 auth, §11 OAuth gap. `docs/steps/StepF1.md` is an outline; `_template.md` and `StepF0.md` are the prompt-file pattern to copy. F0 code is on disk: gateway in `lib/api/client.ts`, `AuthMeResponse` in `types/generated/api.d.ts`, Query + Sonner in `providers/app-providers.tsx`, `lib/api/auth.ts` and `features/auth/index.ts` still `export {}` stubs.

This change writes playbooks (and a short system snapshot). It does not implement `/auth/me`.

## Goals / Non-Goals

**Goals:**
- Same two grains as F0: one fenced prompt per sub-step in `StepF1.md`; thin `F1a` / `F1b` batch files that point into it.
- Lock a modular session-shell architecture in those prompts so a later implement change cannot dump fetch + chip + OAuth into `app/layout.tsx`.
- Name every F1 failure boundary the implementer must prove (401/5xx/network on `/me`, OAuth JSON landing page, guest browsing unblocked).
- Land `docs/app/system.md` so F1 (and later) prompts can cite F0-as-built.

**Non-Goals:**
- Implementing F1 application code, hooks, or header chrome.
- New npm packages.
- Editing `docs/blueprint.md`, `docs/frontendGuide.md`, or `AGENTS.md`.
- Expanding `StepF2.md`–`StepF7.md` beyond their outlines.
- Inventing `FRONTEND_URL` bounce, NextAuth/Better Auth, or destination search.

## Decisions

### 1. Two-layer files (same as F0)

`StepF1.md` is the SSOT for locks, architecture, failure table, feature buildup, and one fenced prompt per sub-step. `docs/steps/batches/F1a.md` and `F1b.md` are session gates: prerequisites, read pointers, order, hard stop, proofs. They do not duplicate prompt bodies.

**Alternative considered:** One session for 1.1–1.3 (outline allows it). Rejected — chrome mixed with the auth module is how fetch and Query keys land in the header.

**Alternative considered:** Self-contained batch files that inline prompts. Rejected — two copies drift (F0 decision 1).

### 2. Batch split: F1a then F1b

| Batch | Sub-steps | Why |
|-------|-----------|-----|
| F1a | 1.1 → 1.2 | Domain module + probe hook + login/logout. Needs local API (`GET /auth/me`). |
| F1b | 1.3 | Shell chrome only: header composes feature exports. No new HTTP. |

Blueprint numbers stay 1.1–1.3. Run order is numeric (unlike F0).

### 3. Modular layers — LOCKED in the playbook

Prompts must name these files and forbid crossing them:

```
lib/api/auth.ts                 HTTP only: getMe, logout
                                generated paths + AuthMeResponse
                                AbortSignal; credentials via gateway
                                mirror lib/api/health.ts

features/auth/use-auth-me.ts    Query key ["auth","me"]
features/auth/use-logout.ts     mutation; invalidate ["auth","me"]
features/auth/start-login.ts    location.assign to {API}/api/v1/auth/google
                                (NOT fetch / NOT the JSON gateway)

features/auth/session-chip.tsx  Guest vs user presentation
features/auth/session-header.tsx brand + chip + login/logout + search placeholder
features/auth/index.ts          public barrel only

app/layout.tsx                  mounts SessionHeader inside AppProviders
                                no auth fetch, no Query keys
```

Rules the prompts must repeat:

- All HTTP goes through `lib/api/client.ts` via `lib/api/auth.ts`. No raw `fetch` in features or layout (login navigation is the one exception — it is a browser redirect, not an API JSON call).
- `useAuthMe` lives in `features/auth/`, not a global `hooks/` dump.
- Do not put `AuthMeResponse` in Zustand. Server/async state is TanStack Query only.
- Do not add Better Auth, NextAuth, or token storage.
- Wire types from `types/generated/api.d.ts`. Do not hand-mirror `frontendGuide.md` §14.

**Alternative considered:** `hooks/use-auth-me.ts` as a cross-cutting hook. Rejected — AGENTS.md prefers feature folders; auth is not shared infrastructure yet.

**Alternative considered:** Header as `components/shell/` with auth imported. Allowed later if chrome grows; F1 keeps the header next to the chip so one feature owns session UI.

### 4. 1.1 proof UI stays on `/dev/ui`

Blueprint 1.1 requires “UI shows Guest” without yet building the header. The 1.1 prompt extends the existing `/dev/ui` scratch page with a small `useAuthMe` readout (guest/user + truncated session id). 1.3 adds `SessionHeader` to the root layout. The scratch readout may remain (dev-only) or stay as-is — do not replace `/dev/ui` with the product header.

**Alternative considered:** Temporary Guest text on `app/page.tsx`. Rejected — pollutes the home placeholder and invites leaving auth UI on the page.

### 5. Login is navigation; logout is a gateway mutation

- Login: `window.location.assign(`${getPublicApiUrl()}/api/v1/auth/google`)`. Helper text next to the CTA documents `frontendGuide.md` §11 (success may land on API JSON, not `:3000`). Guest path stays usable. Do not implement `/auth/done` or pretend bounce works.
- Logout: `POST /api/v1/auth/logout` through `lib/api/auth.ts` (`sendJson`, no retry). Then `queryClient.invalidateQueries({ queryKey: ["auth", "me"] })`. Blueprint note: `wandr_token` clears; `wandr_session` may remain — expected. Do not tell the agent to delete cookies from JS.

### 6. `/me` failures become guest UI, not a crash

Live `/me` is Optional and typically 200 + `is_guest`. The playbook still names 401 / 5xx / network.

- Query key `["auth","me"]`. At most one Query retry; do not stack extra retries on top of the gateway GET retry into a long spinner.
- On error: treat as guest (`is_guest: true`, `user: null`) and show a reconnect control that `refetch`es. Never unmount the app.
- 401 on the probe must not toast-spam. F1.1 may add a Query `meta` opt-out (e.g. `skipErrorToast`) honored by `providers/app-providers.tsx` `QueryCache.onError`. Network / 5xx may still toast once via the existing boundary, plus reconnect on the chip.
- Do not map `/me` 401 to a login wall that blocks the rest of the UI.

### 7. Search entry is a guest-reachable placeholder

F1.3 header includes a Search control that is **not** hidden or disabled for guests. It MUST NOT call `GET /destinations/search`, debounce, or install RHF/Zod. A `Link` to `/` (or a non-submitting button) labeled Search is enough. F2 replaces it with the real field.

**Alternative considered:** Hide Search until F2. Rejected — blueprint proof is “search entry reachable while guest.”

**Alternative considered:** Wire live search in 1.3. Rejected — that is F2; it blows the hard stop.

### 8. No new packages; no route guards

F1 installs nothing. TanStack Query and shadcn Button already exist. Do not wrap routes in “must be logged in.” Guest browsing (home, later search) stays open. `/dev/ui` stays.

### 9. `docs/app/system.md` is an F0 snapshot, not a second bible

Short: tree that exists, gateway + type-lock, providers, env, what is still a stub (`lib/api/auth.ts`, destinations, SSE, map). Cite `AGENTS.md` and `docs/blueprint.md` rather than copying hard rules. F1 `StepF1.md` header links it as “built so far.”

### 10. Prompt mechanics (copy F0)

Each fence: read `AGENTS.md` + F1 locks first; TASK; FEATURE BUILDUP (EXISTS / STILL EMPTY); FAILURE MODE; LLD pattern; WHAT TO CREATE (concrete paths); RULES (Do NOT jump ahead); PowerShell VALIDATION.

F1a prerequisites: F0 ship checklist green; API up at `NEXT_PUBLIC_API_URL`; `GET /api/v1/auth/me` reachable.

F1 ship checklist at the bottom of `StepF1.md` before F2 expansion: probe returns guest or user; logout invalidates; header visible while guest; Search control present and not login-gated; no destinations fetch; no NextAuth.

Update `docs/steps/README.md` with an F1 batches table. Leave F2–F7 outlines.

## Risks / Trade-offs

- [Agent implements F1 code while writing the playbook] → Mitigation: every task and batch file restates docs-only; `lib/api/auth.ts` must still be a stub when this change archives.
- [Agent pastes the whole `StepF1.md`] → Mitigation: header + README: one fence or one batch file.
- [1.3 prompt starts destination search] → Mitigation: locked placeholder; VALIDATION greps that `destinations` module stays a stub and no `search?q=` fetch appears.
- [Login implemented as `getJson("/auth/google")`] → Mitigation: 1.2 prompt forbids gateway fetch for Google; must be `location.assign`.
- [QueryCache toasts every `/me` 401] → Mitigation: 1.1 names `skipErrorToast` (or equivalent) on the probe query.
- [Header owns HTTP] → Mitigation: 1.3 WHAT TO CREATE is compose-only; VALIDATION: `session-header` has no `fetch` / `getJson` / `getMe`.
- [Local API down during later implement] → Mitigation: F1a prerequisites list API up; authoring this playbook does not need the API.

## Migration Plan

Docs-only. No deploy. Rollback = restore the F1 outline, delete `F1a.md` / `F1b.md` / `docs/app/system.md`, revert the README F1 table.

## Open Questions

None. Batch split, module layers, search placeholder, `/dev/ui` probe readout, and OAuth-gap honesty are locked above.
