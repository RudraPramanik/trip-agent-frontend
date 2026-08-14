## ADDED Requirements

### Requirement: Authenticated trip list without fake guest data

The system MUST provide a trip list at `/trips` for authenticated viewers. List data MUST come from `GET /api/v1/trips` as a bare paginated response whose items match generated `TripOut` (not forced through the success envelope). The list page module MUST NOT call the JSON gateway, `fetch`, or Query hooks directly — it MUST mount trip list UI only. The list query MUST NOT run for anonymous viewers. HTTP 401 or `unauthorized` MUST show a login CTA and MUST NOT spin forever or invent a guest list. When `items` is empty, the system MUST show empty UI and MUST NOT invent trips. Guest trip detail at `/trips/{id}` MUST remain Optional + ownership and MUST NOT gain a required-auth wrapper because of the list route.

#### Scenario: Authenticated list loads

- **WHEN** an authenticated viewer opens `/trips` and the API returns a paginated `items` array
- **THEN** the list shows those trips (or empty UI when `items` is empty) and the network shows `GET /api/v1/trips` with credentials

#### Scenario: Guest or unauthorized list

- **WHEN** a guest opens `/trips`, or the list returns 401 / `unauthorized`
- **THEN** a login CTA is shown, no anonymous list is invented, and the UI does not hang on a spinner

#### Scenario: List page does not fetch directly

- **WHEN** `/trips` renders the trip list UI
- **THEN** the page module does not call the JSON gateway, `fetch`, or Query hooks directly

#### Scenario: Detail stays optional

- **WHEN** a guest opens `/trips/{id}` after the list route exists
- **THEN** trip detail still loads without a required-auth wrapper (success, forbidden, or not-found as the API decides)

### Requirement: Claim trip with distinct failure copy

The system MUST allow an authenticated viewer to claim an unclaimed trip they may claim via `POST /api/v1/trips/{trip_id}/claim` as an API envelope whose `data` matches generated `TripOut`. The primary claim control MUST live on trip detail. Guests MUST NOT successfully claim — the control MUST be disabled or hidden, and a 401 MUST surface a login CTA rather than a success toast. On successful claim, list and trip detail caches for that trip (and geojson when present) MUST be invalidated. Claim failure copy MUST be distinct by case: not authenticated (login CTA); session mismatch (different-session copy with **no** login-as-fix); already claimed or ownership conflict (clear cannot-claim / already-claimed copy). The system MUST NOT collapse all claim failures into one generic “couldn’t claim” message. Claim mutations MUST NOT auto-retry. The system MUST NOT invent backend error codes that OpenAPI does not define.

#### Scenario: Claim succeeds when eligible

- **WHEN** an authenticated viewer with a matching session claims an unclaimed trip and the API returns success
- **THEN** the trip reflects the claimed state and list/detail caches for that trip are refreshed

#### Scenario: Claim while guest

- **WHEN** a guest views trip detail or a claim is attempted without login
- **THEN** claim is not presented as success and a login path is used (disabled/hidden control and/or 401 login CTA)

#### Scenario: Claim session mismatch

- **WHEN** claim returns 403 with guest or session-mismatch context
- **THEN** different-session copy is shown and login is not offered as the fix

#### Scenario: Claim already claimed or ownership conflict

- **WHEN** claim returns 403 or 409 indicating the trip is already claimed or cannot be claimed
- **THEN** already-claimed / cannot-claim copy is shown and it is not the session-mismatch sentence

### Requirement: Delete trip with confirm and cache drop

The system MUST allow an authenticated owner to delete a trip via `DELETE /api/v1/trips/{trip_id}` expecting HTTP 204 with an empty body (not parsed as success-envelope JSON). Destructive delete MUST require confirmation. Guests MUST NOT call delete expecting success — the control MUST be disabled or hidden with a login gate if needed. On HTTP 204, the system MUST remove or invalidate the list cache entry for that trip, drop trip detail and geojson caches for that id, and navigate away from `/trips/{id}` when that detail is open. HTTP 403 MUST show ownership/forbidden copy without pretending the trip was deleted. HTTP 404 or `not_found` MUST show already-gone / not-found copy and refresh the list. Delete mutations MUST NOT auto-retry. List and detail page modules MUST NOT call delete mutations directly — they MUST mount feature UI only.

#### Scenario: Delete succeeds

- **WHEN** an authenticated owner confirms delete and the API returns 204
- **THEN** the trip is gone from the list cache, detail/geojson caches for that id are dropped, and if the viewer was on that detail route they are navigated away

#### Scenario: Guest cannot delete

- **WHEN** a guest views list or detail delete controls
- **THEN** delete is disabled or hidden and no anonymous DELETE expecting success is issued

#### Scenario: Delete forbidden

- **WHEN** delete returns 403
- **THEN** ownership/forbidden copy is shown and the UI does not treat the trip as deleted

#### Scenario: Delete not found

- **WHEN** delete returns 404 or `not_found`
- **THEN** already-gone / not-found copy is shown and the list is refreshed
