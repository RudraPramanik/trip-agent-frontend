## MODIFIED Requirements

### Requirement: Shell chrome is guest-unblocked and fetch-free

The product header MUST include brand (Wandr → home), a Search control, a guest/user chip, and Login or Logout. Search MUST be visible and enabled for guests (not hidden, not disabled because `is_guest`). Header Search MUST remain a navigation link to home (optionally with a fragment that targets the home search region). It MUST NOT render a typeahead, MUST NOT call `GET /api/v1/destinations/search`, and MUST NOT import destinations HTTP. Real destination search lives on home. The header MUST NOT issue HTTP itself (no `fetch`, no gateway helpers, no direct `/auth/me` call); it MUST compose the session probe, login navigation, and logout already defined. Root layout MUST NOT add auth checks around page children.

#### Scenario: Header visible while guest

- **WHEN** a guest loads any page
- **THEN** the header shows brand, enabled Search, Guest, and Login

#### Scenario: Search does not hit destinations

- **WHEN** a guest activates Search
- **THEN** no request is made to `/api/v1/destinations/search`

#### Scenario: Header does not own HTTP

- **WHEN** the header renders
- **THEN** it does not call `fetch`, the JSON gateway, or `/auth/me` directly
