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
