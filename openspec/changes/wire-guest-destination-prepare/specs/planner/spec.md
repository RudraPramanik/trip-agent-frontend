## MODIFIED Requirements

### Requirement: Pre-stream destination-not-ready is a JSON gate not SSE

When generate returns HTTP 409 with code `destination_not_ready` before an event stream, the system MUST treat the body as a JSON error, MUST NOT parse it as SSE frames, and MUST show the API message plus a way back to home readiness (`/?destination=`) so the visitor can prepare and poll. The system MUST NOT treat this 409 as missing Google login and MUST NOT show a login wall for it. Other pre-stream failures (401, 422, 5xx, network) MUST show a typed error toast and panel, not an infinite spinner.

#### Scenario: Destination not ready

- **WHEN** generate returns 409 `destination_not_ready` as JSON
- **THEN** the UI shows that error plus a link to `/?destination=` and does not parse the body as SSE frames

#### Scenario: Destination not ready is not a login failure

- **WHEN** generate returns 409 `destination_not_ready` for a guest
- **THEN** the UI does not prompt Google login as the fix and instead sends the visitor back to home readiness to prepare or wait

#### Scenario: Pre-stream network or 5xx

- **WHEN** generate fails before a stream with a network error or 5xx
- **THEN** a typed error toast and panel are shown and the UI does not hang on a spinner
