# core-client Specification

## Purpose

Provides the Wandr frontend’s guest-foundation client: a required public API origin, OpenAPI-locked wire types, one HTTP gateway that parses API envelopes and typed failures, and root async-error reporting so later features do not scatter fetches or silent config errors.

## Requirements

### Requirement: Public API origin is required and explicit

The system MUST resolve a single public API origin from `NEXT_PUBLIC_API_URL` (no trailing slash). The system MUST fail with a clear operator-facing message when that value is missing or empty. The system MUST NOT concatenate an unset origin into request URLs. Frontend configuration MUST be limited to `NEXT_PUBLIC_*` values (API origin and optional map style URL); database, Redis, LLM, and OAuth secrets MUST NOT appear in frontend env.

#### Scenario: Missing API origin

- **WHEN** the public API origin is unset or empty
- **THEN** configuration resolution fails with a message that tells the operator to copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` with no trailing slash

#### Scenario: Origin has a trailing slash

- **WHEN** `NEXT_PUBLIC_API_URL` is set with a trailing slash
- **THEN** the resolved origin has the trailing slash stripped before any request URL is built

### Requirement: Wire types come from live OpenAPI

The system MUST treat types generated from the running API’s OpenAPI document as the source of truth for wire shapes. Type generation MUST fetch `{origin}/openapi.json`. If that fetch fails, generation MUST exit non-zero with a message that includes “start the backend first” and the URL tried, and MUST NOT write an empty or truncated generated types file. Generated types MUST be committed. The system MUST NOT invent endpoint paths or DTO fields that are absent from OpenAPI.

#### Scenario: Successful type generation

- **WHEN** the API serves OpenAPI at `{origin}/openapi.json`
- **THEN** generation produces a non-empty committed types file and a documented command exists to regenerate after backend DTO or route changes

#### Scenario: API unreachable during generation

- **WHEN** OpenAPI cannot be fetched
- **THEN** the process exits non-zero, the message includes “start the backend first” and the URL tried, and any previously committed generated types file is left intact (not replaced with empty or partial output)

### Requirement: Single cookie-aware HTTP gateway

All browser HTTP to the Wandr API MUST go through one gateway. Every call MUST send credentials (cookies) and MUST accept an abort signal, or apply a default timeout abort in the 15–30 second range (default 20s). Idempotent GET requests MAY retry at most once on a network blip. Mutations MUST NOT automatically retry.

#### Scenario: Cookie-scoped request

- **WHEN** the gateway issues a JSON request to the API
- **THEN** the request includes credentials so httpOnly session cookies are sent

#### Scenario: Caller aborts or times out

- **WHEN** the caller provides an abort signal, or no signal is provided
- **THEN** the request is abortable; if no signal is provided, the gateway applies a default timeout abort of 20 seconds

#### Scenario: GET network blip

- **WHEN** an idempotent GET fails due to a transient network error
- **THEN** the gateway retries at most once

#### Scenario: Mutation failure

- **WHEN** a non-GET request fails
- **THEN** the gateway does not automatically retry

### Requirement: Envelope adapters and typed failures

The gateway MUST parse success `ApiResponse` bodies (`success: true`, `data`, optional `message`) and MUST throw a typed API error with `code`, `message`, and HTTP status when the body is an error envelope (`success: false`) or a mapped HTTP error JSON body. Network failures and non-JSON bodies MUST throw a typed network error, not an untyped generic failure. Bare paginated lists, raw JSON (including GeoJSON), HTTP 204 empty bodies, and SSE frames MUST NOT be forced through `ApiResponse` parsing. SSE frame parsing is out of scope for this capability’s implementation in F0; the gateway MUST still reserve a parse mode so those bodies are not treated as `ApiResponse`.

#### Scenario: Success envelope

- **WHEN** the API returns `{ "success": true, "data": … }`
- **THEN** the gateway returns the `data` payload (and does not treat the wrapper as the domain object)

#### Scenario: Error envelope

- **WHEN** the API returns `{ "success": false, "code": "…", "message": "…" }` or an HTTP error with that JSON shape
- **THEN** the gateway throws a typed API error exposing `code`, `message`, and status

#### Scenario: Non-JSON or network failure

- **WHEN** the response body is not JSON or the request fails at the network layer
- **THEN** the gateway throws a typed network error

#### Scenario: Envelope exceptions

- **WHEN** the caller requests paginated, raw, or empty parse mode
- **THEN** the gateway does not require an `ApiResponse` wrapper for that response

### Requirement: Health smoke uses the gateway

The system MUST expose a health read that `GET`s `/api/v1/health` through the gateway (no ad-hoc URL). Health is unauthenticated.

#### Scenario: API healthy

- **WHEN** the API is up and the database ping succeeds
- **THEN** health read returns the success envelope payload (status / env / version as served by the API)

#### Scenario: Database down

- **WHEN** health returns HTTP 503 with `code` `db_unavailable`
- **THEN** the gateway throws a typed API error with that code

### Requirement: Async errors surface as toasts

Root providers MUST report unhandled server-state query and mutation errors as user-visible toasts with a safe message (no raw stack traces). Those errors MUST NOT spam unhandled-rejection noise on an idle load of the app. A query MUST be able to opt out of this toast via an explicit skip flag on that query (`skipErrorToast` or equivalent). Mutations MUST still toast on error. Opt-out MUST NOT disable toasts globally.

#### Scenario: Query or mutation error

- **WHEN** a server-state query or mutation fails with a typed API or network error and the query has not opted out
- **THEN** a toast shows a safe message and the error does not appear as an unhandled rejection

#### Scenario: App load with providers

- **WHEN** the app loads with no failing query
- **THEN** the console has no unhandled-rejection noise from the provider setup

#### Scenario: Query opts out of error toast

- **WHEN** a query is marked to skip error toasts and that query fails
- **THEN** no error toast is shown for that failure; other queries and mutations still toast on error
