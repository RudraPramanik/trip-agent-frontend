## ADDED Requirements

### Requirement: Compose warns when page and API hostnames differ

When the page hostname differs from the configured API origin hostname, compose MUST show a visible warning that guest generate cookies may not apply to `GET /trips/{id}` and that the visitor should open the app and API on the same host (`localhost` with `localhost`, or `127.0.0.1` with `127.0.0.1`). The warning MUST NOT block compose or invent a destination id. The system MUST NOT treat this as a missing frontend LLM key. When hostnames match, compose MUST NOT show that host-mismatch warning.

#### Scenario: Host mismatch on compose

- **WHEN** a guest opens compose and the page hostname differs from the API origin hostname
- **THEN** a host-mismatch warning is visible and generate can still be submitted

#### Scenario: Matching hosts on compose

- **WHEN** a guest opens compose and the page hostname matches the API origin hostname
- **THEN** the host-mismatch warning is not shown
