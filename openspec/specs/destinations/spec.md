# destinations Specification

## Purpose

Lets guests find a destination on home and see whether that destination is ready enough to generate, without a login wall, fake rows, or a hard block on sparse coverage.

## Requirements

### Requirement: Home search is guest-reachable and uses the search contract

The system MUST provide destination search on the home page. Guests MUST be able to use it (no login wall). Search MUST call `GET /api/v1/destinations/search` through the existing cookie-aware HTTP gateway (credentials included, abortable) with query parameter `q`. The payload MUST be the generated `DestinationOut` list from the success envelope. The system MUST NOT invent destinations, MUST NOT invent a `search_available` field, and MUST NOT require authentication to search.

#### Scenario: Guest can search

- **WHEN** a guest opens home and types a query of at least two characters
- **THEN** after a short debounce the system requests `GET /api/v1/destinations/search?q=` with credentials and shows matching `display_name` rows (and country if present) or the empty state

#### Scenario: Query shorter than two characters

- **WHEN** the trimmed search query has length less than 2
- **THEN** the system MUST NOT request `/api/v1/destinations/search` and MAY show helper text that at least two characters are required (not a blocking red error)

#### Scenario: Empty result list

- **WHEN** search succeeds with an empty `data` array
- **THEN** the system shows empty UI (“No destinations match” or equivalent) and MUST NOT invent placeholder destinations

### Requirement: Search is debounced and rate-limit aware

The system MUST debounce the value used for search so rapid typing does not send one request per keystroke (about 300ms of stability). On HTTP 429 or API code `rate_limit_exceeded`, the existing query-error toast MUST appear and the search control MUST be briefly disabled (about 2 seconds). The system MUST NOT add a second custom toast stack for this case. Network or 5xx failures MUST use the existing error toast and the results area MUST show error plus retry, not an infinite spinner.

#### Scenario: Rapid typing

- **WHEN** the visitor types several characters faster than the debounce window
- **THEN** the number of search requests is visibly lower than the number of keystrokes

#### Scenario: Search rate limited

- **WHEN** search returns 429 or `rate_limit_exceeded`
- **THEN** an error toast is shown and the search input is briefly disabled, then usable again

#### Scenario: Search network or 5xx

- **WHEN** search fails with a network error or 5xx after the allowed retry
- **THEN** an error toast is shown and the results area offers retry instead of spinning forever

### Requirement: Selecting a result writes destination into the URL

Selecting a search result MUST write `?destination=<destination id>` into the home URL (replace or push). Destination selection MUST NOT be stored in a client global store. The header Search control MUST NOT be what performs this selection.

#### Scenario: Select a search hit

- **WHEN** the visitor activates a destination row
- **THEN** the home URL includes `?destination=` with that destination’s id

### Requirement: Readiness is warn-and-allow after URL selection

When `?destination=` has a non-empty id, the system MUST request `GET /api/v1/destinations/{destination_id}/readiness` through the gateway (credentials included, abortable). The payload MUST be the generated `DestinationReadinessOut` shape. The system MUST show `tier`, `score`, `place_count`, `enriched_pct`, `indexed_pct`, and `message` when present. Generate MUST stay enabled for `ready`, `limited`, and `sparse`. `limited` MUST show the API `message` inline. `sparse` MUST show that message more prominently (for example amber vs neutral) and MUST NOT disable Generate. The system MUST NOT invent `search_available` and MUST NOT hard-block sparse.

When `?destination=` is missing or empty, the system MUST NOT fetch readiness and MUST NOT show the readiness card (search UI stays visible).

#### Scenario: Ready destination

- **WHEN** readiness succeeds with `tier` `ready`
- **THEN** the card shows the readiness fields and Generate is enabled with no warning required

#### Scenario: Limited destination

- **WHEN** readiness succeeds with `tier` `limited`
- **THEN** Generate is enabled and the API `message` is shown inline

#### Scenario: Sparse destination

- **WHEN** readiness succeeds with `tier` `sparse`
- **THEN** Generate is still enabled and the API `message` is shown more prominently than the limited warning

#### Scenario: No destination selected

- **WHEN** home has no `destination` query param
- **THEN** no readiness request is made and no readiness card is shown

### Requirement: Readiness failures are empty UI, not fake data

HTTP 404 for a destination id MUST show a not-found panel and MUST NOT render a fake tier or score. Network or 5xx on readiness MUST use the existing error toast and the card area MUST show error plus retry, not an infinite spinner.

#### Scenario: Unknown destination id

- **WHEN** `?destination=` is a uuid the API does not know (404)
- **THEN** the system shows not-found copy and does not render readiness metrics

#### Scenario: Readiness network or 5xx

- **WHEN** readiness fails with a network error or 5xx after the allowed retry
- **THEN** an error toast is shown and the card area offers retry instead of spinning forever

### Requirement: Generate CTA does not start planner generate

The Generate control MUST remain enabled at every readiness tier shown. When a destination id is present, activating Generate MUST navigate to `/generate?destination=<id>`. It MUST NOT call `POST /api/v1/planner/generate`, MUST NOT open an SSE client, and MUST NOT import the planner stream client. Helper text MAY say compose is next. Destinations MUST NOT own the compose form.

#### Scenario: Generate click does not generate

- **WHEN** the visitor activates Generate on a selected destination (including `sparse`)
- **THEN** the app navigates to `/generate?destination=` with that destination’s id and the network has no `POST /api/v1/planner/generate` from that click

#### Scenario: Sparse Generate still navigates

- **WHEN** readiness succeeds with `tier` `sparse` and the visitor activates Generate
- **THEN** Generate is not disabled and navigation to `/generate?destination=` still occurs

### Requirement: Destinations HTTP stays out of the page and the header

Home MUST compose destinations UI only. It MUST NOT call the JSON gateway or own search/readiness server-state queries. Features MUST NOT import each other’s HTTP modules. Auth chrome MUST NOT import destinations HTTP.

#### Scenario: Home does not own fetch

- **WHEN** home renders search and (when selected) readiness
- **THEN** the page module does not call the JSON gateway or a server-state query hook directly

#### Scenario: Header does not search

- **WHEN** the header Search control is activated
- **THEN** that activation alone does not request `/api/v1/destinations/search`
