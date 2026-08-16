## ADDED Requirements

### Requirement: HTTP 202 with a success envelope is success

The JSON gateway MUST treat HTTP 202 the same as other 2xx success statuses when the body is a success `ApiResponse` (`success: true`, `data`). It MUST return the `data` payload and MUST NOT throw. It MUST NOT apply a longer than default JSON timeout to wait for background work; callers that need to wait MUST poll a separate read. Non-2xx responses MUST still map through the existing error adapters.

#### Scenario: Prepare accepted as 202

- **WHEN** the API returns HTTP 202 with `{ "success": true, "data": { "status": "preparing", … } }`
- **THEN** the gateway returns that `data` object and does not throw

#### Scenario: 202 does not extend the JSON timeout

- **WHEN** a JSON POST returns 202 quickly
- **THEN** the gateway uses the existing default timeout (about 20 seconds) for that POST and does not hold the connection for minutes of background scrape
