## Why

Guests can finish `POST /planner/generate`, receive `itinerary_done` with a `trip_id`, then land on “This trip belongs to a different session.” The 403 is the API’s locked guest-ownership rule (`wandr_session` must equal `Trip.session_id`). The UI already maps that correctly. What we lack is a frontend fix for the usual *local* cause: `localhost` vs `127.0.0.1` splits the cookie jar so generate’s session is not sent on `GET /trips/{id}`. Weakening backend ownership would be the wrong fix.

## What Changes

- Detect when the page hostname and `NEXT_PUBLIC_API_URL` hostname differ (especially `localhost` vs `127.0.0.1`) and show an operator-facing hint on compose and on the guest 403 trip panel.
- Keep the existing guest-mismatch copy (no login CTA). Add that the trip must come from generate in **this** browser session — not a curl/other-tab `trip_id`.
- Document the trap in `docs/issues/issue.md`. Do **not** rewrite `NEXT_PUBLIC_API_URL` at runtime (IPv6/Docker may require `127.0.0.1:8000`).
- Do **not** change FastAPI `assert_can_access`, put `wandr_session` in JS-readable storage, or pass session ids in the trip URL.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `core-client`: Expose a read-only check that the configured API origin hostname differs from the page hostname; do not silently swap hosts.
- `planner`: When that mismatch is true, compose MUST warn before/during generate that guest trip cookies may not stick.
- `trips`: Guest 403 panel MUST keep distinct session-mismatch copy (no login CTA) and MUST surface the same host-mismatch hint when the check is true.

## Impact

- `lib/config.ts` (or a small helper next to it), `features/planner/compose-form.tsx`, `features/trips/trip-forbidden.tsx`, `docs/issues/issue.md`.
- No new packages, no new `NEXT_PUBLIC_*` keys, no generated-type edits, no sibling API code in this change.
- Sibling `guideagent` CORS for `http://127.0.0.1:3000` stays optional and out of this repo; relaxing trip 403 is out of scope.
