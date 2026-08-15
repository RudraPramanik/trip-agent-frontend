## Purpose

Lets trip viewers browse the destination place catalog so add-stop can pick a real place, without inventing rows, blanking the itinerary, or requiring login to list places.

## ADDED Requirements

### Requirement: Places catalog loads from destination id without a login wall

The system MUST load the place catalog for a trip from `GET /api/v1/places` with a required `destination_id` query taken from the open trip’s `destination_id`. The response MUST be a bare paginated list whose items match generated `PlaceOut` (not forced through the success envelope). Guests MUST be able to view the catalog (None auth). The catalog MUST NOT be invented from `TripOut.places`. The trip detail page module MUST NOT call the places HTTP gateway, `fetch`, or Query hooks directly — it MUST mount feature UI only. The system MUST NOT treat the catalog request as a day-edit mutation.

#### Scenario: Catalog lists places for the trip destination

- **WHEN** trip GET has succeeded with a non-empty `destination_id` and places GET returns a paginated `items` array
- **THEN** the picker shows those places (name and category are enough) and the network shows `GET /api/v1/places?destination_id=` with credentials allowed

#### Scenario: Guest can view the catalog

- **WHEN** a guest opens trip detail after trip GET succeeds
- **THEN** the places catalog may load without a login wall and no day-edit mutation is issued as part of listing places

#### Scenario: Catalog is not the itinerary

- **WHEN** the picker renders after trip GET
- **THEN** catalog rows come from `GET /places` and MUST NOT be synthesized from `TripOut.places`

#### Scenario: Trip page does not fetch places directly

- **WHEN** `/trips/{id}` renders the places picker
- **THEN** the page module does not call the JSON gateway, `fetch`, or Query hooks directly

### Requirement: Empty catalog, unknown destination, and places errors keep the day list

When places GET returns an empty `items` array, the system MUST show empty picker UI and MUST NOT invent places. When the destination is unknown (HTTP 404 or `not_found`), the picker MUST show an error or empty panel and MUST NOT replace or blank the trip day list. Network or 5xx places failures MUST show a typed error path with retry in the picker, not an infinite spinner, and MUST leave the day list visible. The system MUST NOT wrap `/trips/{id}` in required-auth because the picker exists.

#### Scenario: Empty items

- **WHEN** places GET succeeds with `items: []`
- **THEN** the picker shows empty UI, no fake places are invented, and the trip day list remains visible

#### Scenario: Unknown destination

- **WHEN** places GET returns 404 or `not_found`
- **THEN** the picker shows an error or empty panel and the trip day list remains visible

#### Scenario: Places network or 5xx

- **WHEN** places GET fails with a network error or 5xx
- **THEN** the picker offers retry (not an infinite spinner), an error is surfaced, and the trip day list remains visible
