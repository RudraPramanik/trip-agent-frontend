## MODIFIED Requirements

### Requirement: Terminal itinerary_done navigates only with trip_id

On `itinerary_done`, the system MUST navigate to `/trips/{trip_id}` only when `trip_id` is a non-empty string. Missing `trip_id` MUST show an error panel and MUST NOT navigate to an undefined trip. The system MUST NOT treat the SSE itinerary blob as the long-term trip model. Planner UI and the planner stream client MUST NOT `GET /trips/{id}` — durable trip loading belongs to the trips capability. If day title or narrative is present on `itinerary_done`, the system MAY cache it in session UI state keyed by `trip_id`; a hard reload MAY lose that prose. The system MUST NOT invent a narrative API.

The `/trips/{id}` route MUST exist so navigation does not 404. After trip detail ships, that route MUST render trip UI owned by the trips capability (not a planner stub page).

#### Scenario: Itinerary done with trip id

- **WHEN** the stream yields `itinerary_done` with a non-empty `trip_id`
- **THEN** the app navigates to `/trips/{trip_id}` and that route is not a 404

#### Scenario: Itinerary done without trip id

- **WHEN** the stream yields `itinerary_done` without a non-empty `trip_id`
- **THEN** an error panel is shown and the app stays on `/generate`

#### Scenario: Hard reload may drop narrative

- **WHEN** the visitor reloads after `itinerary_done` that had day prose in session cache
- **THEN** missing prose is acceptable; the system MUST NOT fetch a narrative API

#### Scenario: Planner does not load trip HTTP

- **WHEN** generate reaches `itinerary_done` and navigates to `/trips/{trip_id}`
- **THEN** planner modules do not call `GET /api/v1/trips/{id}` — trip detail owns that fetch
