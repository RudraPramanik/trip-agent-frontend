# trips Specification

## Purpose

Lets visitors open a durable trip detail page from `GET /trips/{id}` with days/stops, safe Option A narrative overlay, distinct forbidden panels by viewer context, and an optional MapLibre map fed only by server GeoJSON — never invented coordinates.

## Requirements

### Requirement: Trip detail loads from API without a login wall

The system MUST provide trip detail at `/trips/{id}`. Guests who own the session MUST be able to view (Optional + ownership). The route MUST NOT be wrapped in required-auth. Durable day/stop data MUST come from `GET /api/v1/trips/{trip_id}` as an API envelope whose `data` matches generated `TripOut`. The system MUST NOT treat the planner SSE itinerary blob as the long-term trip model. The trip page module MUST NOT call the JSON gateway, `fetch`, Query hooks, or MapLibre init directly — it MUST mount trip UI only.

#### Scenario: Owned trip opens with days and stops

- **WHEN** a visitor opens `/trips/{id}` for a trip they may access and the API returns `TripOut` with places
- **THEN** days and stops are shown grouped by `day_number` and ordered by `order_in_day`, and the network shows `GET /api/v1/trips/{id}` with credentials

#### Scenario: Trip page is not login-gated

- **WHEN** a guest opens `/trips/{id}` while unauthenticated
- **THEN** the page loads without a login wall (success, forbidden, or not-found as the API decides)

#### Scenario: Trip page does not fetch directly

- **WHEN** `/trips/{id}` renders trip UI
- **THEN** the page module does not call the JSON gateway, `fetch`, Query hooks, or MapLibre init directly

### Requirement: Empty places and missing narrative stay honest

When `TripOut.places` is empty, the system MUST show empty UI and MUST NOT invent stops. Preferences summary MUST use only keys present on `TripOut.preferences` and MUST NOT invent a preference schema. When session narrative cache for the `trip_id` is missing (including after hard reload), the system MUST omit title/prose and MUST still show days/stops from `TripOut`. The system MUST NOT invent narrative text and MUST NOT invent a narrative API. The system MUST NOT read narrative fields from `TripOut` that OpenAPI does not define.

#### Scenario: Empty places

- **WHEN** trip GET succeeds with an empty `places` array
- **THEN** the detail shows empty stop UI and does not invent stops

#### Scenario: Hard reload drops Option A prose

- **WHEN** the visitor hard-reloads a trip whose Option A cache is gone
- **THEN** days/stops from `TripOut` still show and no fake narrative prose is invented

### Requirement: Cached narrative renders as plain markdown only

When Option A cache has title or narrative for the trip, the system MUST render that LLM-authored text as markdown only (GFM allowed). The system MUST NOT enable raw HTML in the markdown pipeline and MUST NOT use `dangerouslySetInnerHTML` for narrative content.

#### Scenario: Cached narrative is markdown-safe

- **WHEN** Option A cache has day title or narrative for the open `trip_id`
- **THEN** the prose is shown as markdown/GFM without raw HTML injection

### Requirement: Forbidden and not-found are distinct panels

HTTP 404 or API code `not_found` MUST show a dedicated not-found panel and MUST NOT render fake days. HTTP 403 with forbidden semantics MUST show one of two panels by **viewer context**, not by inventing a backend session-mismatch error code: when the viewer is a guest, copy MUST indicate the trip belongs to a different session and MUST NOT offer a login CTA; when the viewer is authenticated, copy MUST be ownership-oriented and MUST NOT reuse the guest session-mismatch sentence. Network or 5xx trip GET failures MUST show a typed error path with retry, not an infinite spinner.

#### Scenario: Not found

- **WHEN** trip GET returns 404 or `not_found`
- **THEN** a dedicated not-found panel is shown and no fake days are rendered

#### Scenario: Guest session mismatch

- **WHEN** trip GET returns 403 and the viewer is a guest
- **THEN** session-mismatch copy is shown and no login CTA is offered

#### Scenario: Authenticated ownership forbidden

- **WHEN** trip GET returns 403 and the viewer is authenticated
- **THEN** ownership copy is shown and it is not the guest session-mismatch sentence

#### Scenario: Trip GET network or 5xx

- **WHEN** trip GET fails with a network error or 5xx
- **THEN** a typed error path with retry is shown and the UI does not hang on a spinner

### Requirement: GeoJSON map is list-first and never invents coordinates

After trip GET succeeds, the system MAY request `GET /api/v1/trips/{trip_id}/geojson` as a raw FeatureCollection (not forced through the success envelope). The geojson request MUST NOT run when trip GET failed with 403 or 404. Point features MUST become markers. LineString features MUST become day routes when present. When LineStrings are missing, the system MUST render points only. The system MUST NOT invent `[lng, lat]` and MUST NOT synthesize a FeatureCollection from place lat/lng on the client. Empty or unusable GeoJSON MUST leave no overlay while the day list remains. Tile or style failure MUST collapse or hide the map while the day list remains. Missing map style URL in production MUST collapse the map and MUST NOT silently use an OSM basemap. In development, a documented OSM-compatible fallback MAY be used when the style URL is unset, with helper text that production needs a real style provider. GeoJSON network, 404, or 5xx MUST toast, collapse the map, and keep the day list visible.

#### Scenario: Markers from GeoJSON points

- **WHEN** trip GET succeeded and geojson returns Point features
- **THEN** markers are shown from those features and no client-invented coordinates are used

#### Scenario: Points only without lines

- **WHEN** geojson has Point features and no LineStrings
- **THEN** markers are shown and no routes are invented

#### Scenario: Style or tile failure keeps the list

- **WHEN** the map style URL is unset, broken, or tiles fail
- **THEN** the map collapses or hides and the day list from trip detail remains usable

#### Scenario: No map on forbidden trip

- **WHEN** trip GET returns 403 or 404
- **THEN** geojson is not requested and no map is painted

#### Scenario: GeoJSON failure keeps the list

- **WHEN** geojson returns 404, 5xx, or a network error after a successful trip GET
- **THEN** an error toast is shown, the map is collapsed, and the day list remains

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

### Requirement: Trip detail uses a product itinerary layout without weakening list-first map rules

Trip detail MUST present days and stops as a product itinerary (timeline or equivalent), not only a stacked developer dump. On a wide viewport the map MAY sit beside the itinerary; on a narrow viewport the day list MUST remain the primary surface and the map MUST be secondary (collapsed, tab, or sheet). Map, GeoJSON, 403, 404, empty-places, markdown-only narrative, claim, delete, and owner day-edit contracts already specified for this capability MUST still hold: missing LineStrings MUST NOT invent routes; tile or style failure MUST keep the day list usable; guest session-mismatch 403 MUST remain distinct from authenticated ownership 403 and MUST NOT gain a login CTA; narrative MUST stay `react-markdown` + GFM without raw HTML. The trip page module MUST still mount feature UI only.

#### Scenario: Wide viewport can split map and itinerary

- **WHEN** a visitor opens an accessible trip on a wide viewport and geojson has features and the map is shown
- **THEN** the itinerary (days/stops) remains visible beside or with the map and stops still come from `TripOut.places`

#### Scenario: Narrow viewport keeps the day list primary

- **WHEN** a visitor opens an accessible trip on a narrow viewport
- **THEN** the day list is reachable without depending on the map remaining expanded

#### Scenario: Map failure still leaves the itinerary

- **WHEN** the map style URL is unset, broken, or tiles fail after a successful trip GET
- **THEN** the map collapses or hides and the product itinerary remains usable

#### Scenario: Forbidden copy stays distinct under the new layout

- **WHEN** trip GET returns 403 and the viewer is a guest
- **THEN** session-mismatch copy is shown in the product empty/error layout and no login CTA is offered

