# session-shell Specification

## Purpose

Lets the Wandr frontend act as a FastAPI cookie client: learn guest vs signed-in user from the session probe, start Google login by navigating to the API, logout without touching cookies from JavaScript, and keep browsing (including Search) unblocked for guests.

## Requirements

### Requirement: Session identity comes from the cookie probe

The system MUST learn guest vs authenticated user only by calling `GET /api/v1/auth/me` through the existing HTTP gateway (credentials included, abortable). The payload MUST be the generated `AuthMeResponse` shape (`is_guest`, `session_id`, optional `user`). The system MUST NOT store access tokens in `localStorage`, `sessionStorage`, or readable JavaScript cookies. The system MUST NOT introduce a Next.js session owner (Better Auth, NextAuth, or a BFF that issues its own tokens).

#### Scenario: Typical guest probe

- **WHEN** the visitor has no `wandr_token` and `GET /api/v1/auth/me` succeeds with `is_guest: true` and `user` null
- **THEN** the UI presents Guest and may show a truncated `session_id`

#### Scenario: Authenticated probe

- **WHEN** `GET /api/v1/auth/me` succeeds with `is_guest: false` and a `user` object
- **THEN** the UI presents the user’s name or email from that object and MUST NOT fetch an avatar from a new endpoint

### Requirement: Probe failures are guest, not a login wall

A failed or unauthorized session probe MUST NOT crash the app, MUST NOT wrap routes in required-auth, and MUST NOT hide Home, `/dev/ui`, or the Search control. HTTP 401 MUST be treated as guest (`is_guest` true, `user` null) with no error toast. After a network blip the probe MAY retry at most once (gateway GET retry plus at most one server-state retry); remaining 5xx or network failure MUST still show guest UI plus a reconnect control that re-runs the probe.

#### Scenario: Probe returns 401

- **WHEN** `GET /api/v1/auth/me` returns 401
- **THEN** the UI shows Guest, the rest of the page remains usable, and no error toast is shown for that probe

#### Scenario: Probe fails after retry

- **WHEN** `GET /api/v1/auth/me` fails with 5xx or a network error after the allowed retry
- **THEN** the UI shows Guest plus a reconnect control; the app stays mounted

#### Scenario: Guest can still browse

- **WHEN** the visitor is guest (including after 401 or probe error)
- **THEN** Home, `/dev/ui`, and Search remain reachable; no login wall is shown

### Requirement: Google login is browser navigation

Login MUST start by navigating the browser to `{API origin}/api/v1/auth/google`. The system MUST NOT call that URL through the JSON gateway (`getJson` / `sendJson` / `fetch` of the OAuth start). Adjacent to the Login control, the system MUST show helper text that OAuth success may leave the user on the API host JSON page until a backend `FRONTEND_URL` bounce exists, and that guest browsing still works. The system MUST NOT implement `/auth/done` or a Next rewrite that fakes that bounce.

#### Scenario: Guest clicks Login

- **WHEN** a guest activates Login
- **THEN** the browser navigates off-origin to `{API}/api/v1/auth/google` (or the API’s not-configured / error JSON page)

#### Scenario: OAuth gap is visible

- **WHEN** Login is shown
- **THEN** helper text states that return to the app is incomplete until `FRONTEND_URL` bounce exists and that guest use still works

### Requirement: Logout goes through the gateway and refreshes identity

Logout MUST `POST /api/v1/auth/logout` through the gateway with credentials and no automatic mutation retry. On success the system MUST re-probe session identity (invalidate the session probe cache). The system MUST NOT delete cookies from JavaScript. After logout, `wandr_session` MAY still exist; a successful re-probe MUST show guest. If logout fails, the system MUST keep the current chip/readout until a later successful re-probe; the existing mutation error toast MAY fire.

#### Scenario: Successful logout

- **WHEN** logout POST succeeds
- **THEN** the session probe runs again and the UI shows Guest; cookies are not deleted from JavaScript

#### Scenario: Logout request fails

- **WHEN** logout POST fails
- **THEN** the UI does not pretend logout succeeded; an error toast MAY appear; the chip stays as it was until `/me` succeeds again

### Requirement: Shell chrome is guest-unblocked and fetch-free

The product header MUST include brand (Wandr → home), a Search control, a guest/user chip, and Login or Logout. Search MUST be visible and enabled for guests (not hidden, not disabled because `is_guest`). Header Search MUST remain a navigation link to home (optionally with a fragment that targets the home search region). It MUST NOT render a typeahead, MUST NOT call `GET /api/v1/destinations/search`, and MUST NOT import destinations HTTP. Real destination search lives on home. The header MUST NOT issue HTTP itself (no `fetch`, no gateway helpers, no direct `/auth/me` call); it MUST compose the session probe, login navigation, and logout already defined. Root layout MUST NOT add auth checks around page children.

#### Scenario: Header visible while guest

- **WHEN** a guest loads any page
- **THEN** the header shows brand, enabled Search, Guest, and Login

#### Scenario: Search does not hit destinations

- **WHEN** a guest activates Search
- **THEN** no request is made to `/api/v1/destinations/search`

#### Scenario: Header does not own HTTP

- **WHEN** the header renders
- **THEN** it does not call `fetch`, the JSON gateway, or `/auth/me` directly
