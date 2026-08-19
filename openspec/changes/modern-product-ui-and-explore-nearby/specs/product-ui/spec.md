## Purpose

Gives Wandr a shared product chrome and screen layouts so Plan, Generate, and Trips read as a modern trip platform, while empty states, errors, and modular page mounts stay honest.

## ADDED Requirements

### Requirement: Product chrome covers the trip-planning surfaces

The system MUST apply a shared product visual system (travel tokens, typography, card elevation, sticky shell) to Home (`/`), Generate (`/generate`), trip list (`/trips`), and trip detail (`/trips/{id}`). Those routes MUST remain reachable without a required-auth wrapper except where the existing trip-list guest gate already applies. Pages MUST still mount feature barrels only and MUST NOT call the JSON gateway, `fetch`, or Query hooks directly. The system MUST NOT replace the trip-planning flow with a chat workspace shell.

#### Scenario: Guest sees product home

- **WHEN** a guest opens `/`
- **THEN** destination search is presented inside the product home layout (hero or equivalent) and is usable without login

#### Scenario: Pages still do not own fetch

- **WHEN** home, generate, trip list, or trip detail renders feature UI
- **THEN** the page module does not call the JSON gateway, `fetch`, or Query hooks directly

#### Scenario: Planner is not a chat product

- **WHEN** a visitor opens `/generate`
- **THEN** compose remains a PlanRequest form (prompt plus the existing optional fields) and MUST NOT become a free-form chat client that invents messages or endpoints

### Requirement: Home search and readiness stay contract-true under the new layout

Home MUST still debounce destination search, require at least two characters before requesting `GET /api/v1/destinations/search`, write `?destination=` on select, show readiness only when that query is present, warn-and-allow sparse at the planner floor, show Prepare below the floor, and navigate Generate to `/generate?destination=` without posting planner generate. Empty search, 404 destination, 429, and network/5xx MUST remain empty/error/retry UI with no invented destinations or readiness metrics.

#### Scenario: Search still hits the live contract

- **WHEN** a guest types a query of at least two characters on home
- **THEN** after debounce the system requests `GET /api/v1/destinations/search?q=` with credentials and shows only returned `display_name` rows (and country if present) or the empty state

#### Scenario: Generate from home still does not stream

- **WHEN** the visitor activates Generate on a selected destination that meets the planner floor
- **THEN** the app navigates to `/generate?destination=` and the network has no `POST /api/v1/planner/generate` from that click

### Requirement: Compose keeps every PlanRequest field

The generate compose surface MUST still submit generated `PlanRequest` fields only: required `destination_id` and `raw_input`, optional `days`, `base_lat`, `base_lng`, and `accommodation_label`. Latitude and longitude MAY be placed behind an advanced disclosure, but they MUST remain available. Missing destination MUST still show pick-a-destination copy with a path back to home. Streaming, cancel/abort, 409 `destination_not_ready`, clarification as a fresh POST, and `itinerary_done` navigation MUST keep the existing planner contracts.

#### Scenario: Optional coordinates remain available

- **WHEN** a visitor opens compose with a destination
- **THEN** they can still supply `base_lat` and `base_lng` (directly or after expanding an advanced control) and those values are included on generate when provided

#### Scenario: Empty raw input still does not POST

- **WHEN** the visitor submits compose with empty or whitespace-only `raw_input`
- **THEN** a visible field error is shown and the network has no `POST /api/v1/planner/generate`

### Requirement: Trip list cards do not invent trip identity

Authenticated trip list items MUST still come from paginated `TripOut` and MAY be presented as cards (days, status, delete). The system MUST NOT invent a trip title, destination display name, or cover photo from fields OpenAPI does not define on `TripOut`. Guest or 401 list MUST still show a login CTA and MUST NOT invent a guest list.

#### Scenario: List cards use only trip fields

- **WHEN** an authenticated viewer opens `/trips` and the API returns items
- **THEN** each row/card shows data present on those `TripOut` objects (such as days and status) and does not display a fabricated destination name

#### Scenario: Guest list still has no fake trips

- **WHEN** a guest opens `/trips`
- **THEN** a login CTA is shown and no anonymous trip cards are invented

### Requirement: Layouts work on a phone without hiding the trip

Product layouts MUST remain usable at a phone viewport (no required horizontal page scroll at 375 CSS pixels for primary content). On a narrow viewport, trip detail MUST keep the day list reachable if the map is collapsed, in a tab, or in a sheet. Keyboard users MUST be able to reach primary Search, Generate, Explore, Trips, Login/Logout, and compose submit controls.

#### Scenario: Narrow trip detail stays list-first

- **WHEN** a visitor opens an owned trip on a viewport about 375 CSS pixels wide and the map is collapsed or in a secondary surface
- **THEN** the day list remains visible and usable without horizontal page scroll

#### Scenario: Primary nav is keyboard reachable

- **WHEN** a visitor tabs through the product header
- **THEN** brand, Search, Explore, Trips, and Login or Logout can receive focus
