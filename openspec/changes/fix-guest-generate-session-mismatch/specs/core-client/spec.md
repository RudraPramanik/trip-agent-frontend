## ADDED Requirements

### Requirement: Page vs API hostname mismatch is detectable and never silently rewritten

The system MUST expose whether the configured public API origin hostname differs from the current page hostname (for example `localhost` vs `127.0.0.1`). That check MUST be read-only. The system MUST NOT rewrite `NEXT_PUBLIC_API_URL` at runtime to force the hosts to match. The system MUST NOT read or write `wandr_session` from JavaScript.

#### Scenario: Matching hosts

- **WHEN** the page hostname and the configured API origin hostname are the same
- **THEN** the mismatch check is false and no host-swap of the API origin occurs

#### Scenario: Localhost vs loopback mismatch

- **WHEN** the page is served on `localhost` and the API origin hostname is `127.0.0.1`, or the reverse
- **THEN** the mismatch check is true and the resolved API origin is left unchanged

#### Scenario: No silent rewrite

- **WHEN** the mismatch check is true
- **THEN** subsequent API URLs still use the configured origin; the client does not substitute the page hostname into the API URL
