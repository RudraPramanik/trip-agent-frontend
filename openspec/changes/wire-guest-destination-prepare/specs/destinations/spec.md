## ADDED Requirements

### Requirement: Search and selection do not scrape or prepare

Search and choosing a result MUST NOT call `POST /api/v1/destinations/{destination_id}/prepare` and MUST NOT wait on Overpass. A newly geocoded destination MAY appear in search with `place_count` 0. The system MUST NOT invent destinations and MUST NOT require login to search.

#### Scenario: Search a new place stays fast

- **WHEN** a guest searches for a place that is not yet seeded with POIs
- **THEN** search returns matching rows without a prepare request on the network

#### Scenario: Selecting a result does not prepare

- **WHEN** the visitor activates a search row
- **THEN** the home URL includes `?destination=` with that id and the network has no `POST /api/v1/destinations/{id}/prepare` from that click

### Requirement: Guests can prepare a destination below the place floor

When readiness `place_count` is below the planner floor (UI default 10), the readiness card MUST show a Prepare control that guests can use without login. Activating Prepare MUST `POST /api/v1/destinations/{destination_id}/prepare` through the cookie-aware JSON gateway (credentials included, abortable, no automatic retry). The request MUST omit `radius_km` so the API default applies. The payload MUST be the generated prepare-out shape (`destination_id`, `status` `ready` or `preparing`, `place_count`). HTTP 200 with `status=ready` MUST refetch readiness and MUST NOT start a long wait. HTTP 202 with `status=preparing` MUST start readiness polling (see poll requirement). HTTP 429 or `rate_limit_exceeded` MUST show the existing error toast and briefly disable Prepare (about 2 seconds). Network or 5xx MUST toast and keep the card usable (retry), not an infinite spinner. The system MUST NOT show a login wall for prepare and MUST NOT offer country/region scrape or a radius control.

#### Scenario: Guest prepares a shell destination

- **WHEN** readiness `place_count` is below 10 and a guest activates Prepare
- **THEN** the network shows `POST /api/v1/destinations/{id}/prepare` with credentials and no login wall

#### Scenario: Already at the floor returns ready

- **WHEN** prepare returns HTTP 200 and `status` `ready`
- **THEN** readiness is refetched and Generate becomes enabled without a 120s wait

#### Scenario: Prepare starts or is in flight

- **WHEN** prepare returns HTTP 202 and `status` `preparing`
- **THEN** the UI shows that the place is being prepared and readiness polling starts

#### Scenario: Prepare is rate limited

- **WHEN** prepare returns 429 or `rate_limit_exceeded`
- **THEN** an error toast is shown, Prepare is briefly disabled, and the system MUST NOT auto-retry prepare

### Requirement: Preparing destinations poll readiness until the floor or timeout

After a 202 prepare, the system MUST poll `GET /api/v1/destinations/{destination_id}/readiness` about every 2 seconds for up to about 120 seconds, aborting in-flight polls on unmount. The first sparse or zero `place_count` poll MUST NOT be treated as a failure. When `place_count` meets the planner floor (UI default 10), polling MUST stop and Generate MUST become enabled (tier warnings still apply). If the timeout elapses and `place_count` is still below the floor, polling MUST stop and the card MUST show that there are not enough places — not a login error and not an SSE error. The system MUST NOT use the JSON gateway’s default ~20s timeout as the prepare wait.

#### Scenario: First empty poll is expected

- **WHEN** polling starts after 202 and the first readiness payload has `place_count` 0 or `tier` `sparse`
- **THEN** the UI keeps preparing/polling and MUST NOT show a terminal failure

#### Scenario: Floor reached while polling

- **WHEN** a poll returns `place_count` of at least 10 before the timeout
- **THEN** polling stops and Generate is enabled

#### Scenario: Poll timeout still below floor

- **WHEN** about 120 seconds pass and `place_count` is still below 10
- **THEN** polling stops and the card shows not-enough-places copy with no login CTA

## MODIFIED Requirements

### Requirement: Readiness is warn-and-allow after URL selection

When `?destination=` has a non-empty id, the system MUST request `GET /api/v1/destinations/{destination_id}/readiness` through the gateway (credentials included, abortable). The payload MUST be the generated `DestinationReadinessOut` shape. The system MUST show `tier`, `score`, `place_count`, `enriched_pct`, `indexed_pct`, and `message` when present. Generate MUST be enabled when `place_count` meets the planner floor (UI default 10), including `tier` `ready`, `limited`, and `sparse`. Generate MUST be disabled when `place_count` is below that floor. `limited` MUST show the API `message` inline when Generate is allowed. `sparse` MUST show that message more prominently (for example amber vs neutral) and MUST NOT disable Generate when the floor is already met. Empty readiness (score 0 / places 0) after selecting a new place MUST be shown as expected coverage, not as a not-found or login failure. The system MUST NOT invent `search_available` and MUST NOT hard-block `sparse` solely because of tier.

When `?destination=` is missing or empty, the system MUST NOT fetch readiness and MUST NOT show the readiness card (search UI stays visible).

#### Scenario: Ready destination at or above the floor

- **WHEN** readiness succeeds with `tier` `ready` and `place_count` of at least 10
- **THEN** the card shows the readiness fields and Generate is enabled with no warning required

#### Scenario: Limited destination at or above the floor

- **WHEN** readiness succeeds with `tier` `limited` and `place_count` of at least 10
- **THEN** Generate is enabled and the API `message` is shown inline

#### Scenario: Sparse destination at or above the floor

- **WHEN** readiness succeeds with `tier` `sparse` and `place_count` of at least 10
- **THEN** Generate is still enabled and the API `message` is shown more prominently than the limited warning

#### Scenario: Below the place floor

- **WHEN** readiness succeeds with `place_count` below 10 (any tier)
- **THEN** Generate is disabled, Prepare is available, and the card is not a login wall

#### Scenario: No destination selected

- **WHEN** home has no `destination` query param
- **THEN** no readiness request is made and no readiness card is shown

### Requirement: Generate CTA does not start planner generate

When Generate is enabled (`place_count` at or above the planner floor), activating it MUST navigate to `/generate?destination=<id>`. It MUST NOT call `POST /api/v1/planner/generate`, MUST NOT open an SSE client, and MUST NOT import the planner stream client. Helper text MAY say compose is next. Destinations MUST NOT own the compose form. When Generate is disabled because the floor is unmet, activating Prepare MUST NOT navigate to compose.

#### Scenario: Generate click does not generate

- **WHEN** the visitor activates Generate on a selected destination whose `place_count` is at least 10 (including `sparse`)
- **THEN** the app navigates to `/generate?destination=` with that destination’s id and the network has no `POST /api/v1/planner/generate` from that click

#### Scenario: Sparse at floor still navigates

- **WHEN** readiness succeeds with `tier` `sparse`, `place_count` of at least 10, and the visitor activates Generate
- **THEN** Generate is not disabled and navigation to `/generate?destination=` still occurs

#### Scenario: Below floor does not navigate to compose

- **WHEN** readiness `place_count` is below 10
- **THEN** Generate does not navigate to `/generate` and Prepare is the primary action
