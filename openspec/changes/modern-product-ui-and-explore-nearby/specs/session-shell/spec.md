## MODIFIED Requirements

### Requirement: Shell chrome is guest-unblocked and fetch-free

The product header MUST include brand (Wandr → home), a Search control, an Explore control, a Trips control, a guest/user chip, and Login or Logout. Search, Explore, and brand MUST be visible and enabled for guests (not hidden, not disabled because `is_guest`). Header Search MUST remain a navigation link to home (optionally with a fragment that targets the home search region). It MUST NOT render a typeahead, MUST NOT call `GET /api/v1/destinations/search`, and MUST NOT import destinations HTTP. Real destination search lives on home (and MAY also be composed on Explore through the destinations feature barrel, not through the header). Explore MUST navigate to `/explore`. Trips MUST navigate to `/trips`. The header MUST NOT issue HTTP itself (no `fetch`, no gateway helpers, no direct `/auth/me` call); it MUST compose the session probe, login navigation, and logout already defined. The header MUST NOT import destinations, places, planner, or trips HTTP modules. Root layout MUST NOT add auth checks around page children.

#### Scenario: Header visible while guest

- **WHEN** a guest loads any page
- **THEN** the header shows brand, enabled Search, Explore, Trips, Guest, and Login

#### Scenario: Search does not hit destinations

- **WHEN** a guest activates Search
- **THEN** no request is made to `/api/v1/destinations/search`

#### Scenario: Header does not own HTTP

- **WHEN** the header renders
- **THEN** it does not call `fetch`, the JSON gateway, or `/auth/me` directly

#### Scenario: Explore navigates without destinations HTTP in the header

- **WHEN** a guest activates Explore
- **THEN** the app navigates to `/explore` and that header activation alone does not request `/api/v1/destinations/search` or `/api/v1/places`

#### Scenario: Trips control stays a link

- **WHEN** a guest activates Trips in the header
- **THEN** the app navigates to `/trips` and the header does not request `GET /api/v1/trips` itself
