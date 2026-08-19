## Purpose

Lets guests browse a location-based, Instagram-like place feed (cafes, parks, viewpoints, and other catalog categories) without inventing a nearby API, fake place ids, or add-to-trip mutations.

## ADDED Requirements

### Requirement: Explore is guest-reachable and page-modular

The system MUST provide Explore Nearby at `/explore`. Guests MUST be able to open it (no required-auth wrapper). The explore page module MUST mount feature UI only and MUST NOT call the JSON gateway, `fetch`, Query hooks, or MapLibre init directly. Explore MUST NOT import places or destinations HTTP modules; it MAY compose those features through their public barrels. `/explore` MAY accept `?destination=` using the same destination id already used on home.

#### Scenario: Guest can open explore

- **WHEN** a guest opens `/explore` while unauthenticated
- **THEN** the page loads without a login wall

#### Scenario: Explore page does not fetch directly

- **WHEN** `/explore` renders explore UI
- **THEN** the page module does not call the JSON gateway, `fetch`, or Query hooks directly

### Requirement: Live feed uses the existing places catalog only

When `?destination=` has a non-empty destination id, the explore feed MUST load places from `GET /api/v1/places?destination_id=` (bare paginated `PlaceOut`) through the existing places feature. The system MUST NOT request a nearby, radius, or reverse-geocode path that is absent from OpenAPI. Empty `items`, HTTP 404 / `not_found`, and network or 5xx MUST show empty or error-plus-retry in the feed and MUST NOT invent places. Category chips MAY filter the returned `PlaceOut.category` values; unknown categories MUST still appear under All (or an equivalent unfiltered view) rather than being dropped silently without an All path.

#### Scenario: Destination-anchored live cards

- **WHEN** a visitor opens `/explore?destination=` with a known destination and places GET returns `items`
- **THEN** the feed shows those places (name and category at minimum) and the network shows `GET /api/v1/places?destination_id=` with credentials allowed

#### Scenario: Empty or unknown destination catalog

- **WHEN** places GET returns empty `items` or 404 / `not_found`
- **THEN** the feed shows empty or not-found UI and does not invent place cards

#### Scenario: No invented nearby HTTP

- **WHEN** explore is used with or without a destination
- **THEN** the network has no request to a nearby/radius/reverse-geocode path that is not in the live OpenAPI document

### Requirement: GPS-only browsing is labeled preview, not live catalog

When no destination id is selected, the system MAY request the browser geolocation permission and MAY show a bounded preview (mock) feed. Preview cards MUST be visually labeled as preview. Preview identifiers MUST NOT be used as `destination_id` or `place_id` on any Wandr API call. If geolocation is denied, unavailable, or times out, the system MUST show a dedicated permission/unavailable panel plus a way to pick a destination through existing destination search UI, and MUST NOT spam a generic error toast as the only recovery. The system MUST NOT reverse-geocode GPS into a destination uuid.

#### Scenario: Preview feed is labeled

- **WHEN** a visitor grants location and has no `destination` query
- **THEN** any mock/preview cards are visibly labeled preview and no Wandr write uses those ids

#### Scenario: Location denied still allows destination pick

- **WHEN** geolocation is denied or unavailable
- **THEN** a dedicated panel is shown and destination search (existing contract) remains available so the visitor can switch to the live catalog

#### Scenario: GPS does not mint a destination id

- **WHEN** the visitor grants geolocation without selecting a destination
- **THEN** the system does not navigate using a fabricated destination uuid

### Requirement: Card media and copy stay honest

Explore cards MUST NOT claim stock or category illustrations are photographs of that OSM venue. When `PlaceOut.summary` is present it MAY be shown as text (not raw HTML). Image load failure MUST fall back to a non-photo treatment (gradient, icon, or equivalent). The system MUST NOT use `dangerouslySetInnerHTML` or `rehype-raw` for place summaries.

#### Scenario: Failed image still shows a card

- **WHEN** a card image fails to load
- **THEN** the card remains usable with name (and category if present) and a non-photo fallback

#### Scenario: Summary is not raw HTML

- **WHEN** a live `PlaceOut` has a summary string
- **THEN** it is shown as text or markdown without raw HTML injection

### Requirement: Explore does not mutate trips

Explore MUST NOT call trip day-edit endpoints (add, reorder, remove, reoptimize). A live place card MAY offer navigation to home or generate with that place’s real `destination_id`. A preview card MUST NOT navigate with a fake uuid; it MAY send the visitor to home search instead.

#### Scenario: Live card plans the real destination

- **WHEN** the visitor activates plan/generate from a live `PlaceOut` card
- **THEN** navigation uses that place’s `destination_id` and no day-edit POST/PATCH/DELETE is issued from explore

#### Scenario: Preview card does not use fake ids

- **WHEN** the visitor activates the primary CTA on a preview card
- **THEN** the app does not request Wandr APIs with the preview id as `destination_id` or `place_id`
