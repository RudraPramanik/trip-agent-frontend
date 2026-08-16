## Context

See `proposal.md` for why. Guest 403 copy already lives in `features/trips/trip-forbidden.tsx`; generate already uses `credentials: "include"` in `lib/sse/planner.ts`. Backend `TripService.assert_can_access` is the policy source of truth and is not changed here. `docs/app/system.md` already notes `localhost:8000` vs `127.0.0.1:8000` for Docker/IPv6.

## Goals / Non-Goals

**Goals:**

- One hostname-mismatch helper used by compose and the guest 403 panel.
- Honest copy for “other session’s trip_id” vs “cookie jar split.”
- Issue log updated so operators do not treat this 403 as a generate-timeout or missing LLM key.

**Non-Goals:**

- Relaxing or special-casing FastAPI trip 403.
- Runtime rewrite of `NEXT_PUBLIC_API_URL`.
- New env vars, packages, or OpenAPI fields.
- Sibling CORS PR (optional later in `guideagent`).

## Decisions

### 1. Frontend hint, not backend policy change

**Choice:** Keep `wandr_session` === `Trip.session_id`. Fix the local cookie-host footgun in the UI.

**Why:** Putting session in a readable cookie or in the trip URL would violate FE `AGENTS.md`. A 403 when the cookie does not match is correct. Cache replay still `save_from_state` with the current session id, so the API is not handing back another session’s trip.

**Alternative considered:** Add `http://127.0.0.1:3000` to API CORS only. Helps only if the operator also browses that origin; does not explain curl/other-session ids. Can be a later BE change.

### 2. Compare hostnames; do not swap origins

**Choice:** Parse `getPublicApiUrl()` and `window.location.hostname`. Mismatch when they differ (case-insensitive). SSR: treat as no mismatch (no `window`) so compose/forbidden do not warn on the server render.

**Why:** Silent rewrite to the page host can point `localhost:8000` at the wrong process (`docs/app/system.md`).

**Alternative considered:** Always coerce API to `127.0.0.1`. Rejected — breaks operators who correctly use `localhost` both sides.

### 3. Helper in `lib/config.ts`, UI in feature folders

**Choice:** Pure function next to `getPublicApiUrl` (e.g. `apiHostnameMismatchesPage(pageHostname: string | undefined)`). Planner and trips import it. No new `hooks/` dump, no `app/` fetch.

**Why:** Matches modular layers. Comparison is config, not HTTP.

### 4. Copy is additive

**Choice:** Keep the current guest title. Add one sentence that the trip must be generated in this tab. Show host hint only when the helper is true.

**Why:** Spec already forbids a login CTA on guest 403. Do not invent a new API `code`.

## Risks / Trade-offs

- [Operator ignores the hint and still mixes hosts] → Mitigation: hint on compose *before* a long generate, not only after 403.
- [False positive if user uses a LAN IP for the app and `localhost` for the API] → Mitigation: any hostname difference counts; copy says use the same host pair.
- [They opened a curl trip_id with matching hosts] → Mitigation: generate-in-this-session sentence still shows; host hint omitted.

## Migration Plan

Ship with the Next app. No data migration. Rollback is revert the hint/helper; 403 behavior unchanged.

## Open Questions

None. Sibling CORS for `127.0.0.1:3000` is explicitly out of this change.
