## Purpose

Lets guests compose a plan request and run abortable planner generate as a POST SSE stream, including clarification as a fresh generate, without treating the stream blob as the durable trip.

## ADDED Requirements

### Requirement: Guests can compose on generate without a login wall

The system MUST provide a compose surface at `/generate`. Guests MUST be able to open it (no required-auth wrapper). `destination_id` MUST come from the `destination` query parameter already written by home selection. The compose payload MUST match generated `PlanRequest`: required `destination_id` and `raw_input`, optional `days`, `base_lat`, `base_lng`, and `accommodation_label`. The system MUST NOT invent extra fields.

#### Scenario: Guest opens compose with a destination

- **WHEN** a guest opens `/generate?destination=` with a non-empty destination id
- **THEN** the compose form is shown and that destination id is used without the visitor retyping the uuid

#### Scenario: Generate is not login-gated

- **WHEN** a guest opens `/generate` while unauthenticated
- **THEN** the page loads without a login wall

### Requirement: Invalid or missing compose does not start generate

Client-invalid compose MUST show visible field errors and MUST NOT request `POST /api/v1/planner/generate`. Trimmed `raw_input` length less than 1 is invalid. When `destination` is missing or empty, the system MUST show pick-a-destination copy with a way back to home, MUST NOT invent a destination uuid, and MUST NOT POST generate.

#### Scenario: Empty raw input

- **WHEN** the visitor submits compose with empty or whitespace-only `raw_input`
- **THEN** a visible field error is shown and the network has no `POST /api/v1/planner/generate`

#### Scenario: Missing destination query

- **WHEN** the visitor opens `/generate` with no `destination` query param
- **THEN** pick-a-destination UI is shown, no compose POST is made, and no destination uuid is invented

### Requirement: Generate is abortable POST SSE not EventSource or JSON envelope

Starting generate MUST `POST /api/v1/planner/generate` with credentials included, `Accept: text/event-stream`, and a JSON `PlanRequest` body. The request MUST be abortable by aborting the underlying HTTP fetch (unmount, route change, and explicit Cancel). The system MUST parse `event:` / `data:` frames. The system MUST NOT use browser `EventSource`. The system MUST NOT send this POST through the JSON envelope client (that client times out and JSON-parses the body). The system MUST NOT auto-retry a full generate without explicit user action. Unknown event names MUST be ignored. The generate limiter is 10/min; HTTP 429 or API code `rate_limit_exceeded` MUST show the existing error toast and briefly disable submit (about 2 seconds).

#### Scenario: Valid submit starts generate

- **WHEN** compose is valid and the visitor submits
- **THEN** the network shows `POST /api/v1/planner/generate` with credentials (SSE stream or a pre-stream JSON error)

#### Scenario: Cancel or leave aborts the HTTP request

- **WHEN** a generate is in flight and the visitor cancels or navigates away
- **THEN** the client aborts the fetch (network shows canceled) and the API background task MUST cancel within a few seconds — stopping the reader without aborting fetch is not sufficient

#### Scenario: Generate is rate limited

- **WHEN** generate returns 429 or `rate_limit_exceeded` before a stream
- **THEN** an error toast is shown, submit is briefly disabled, and the system MUST NOT auto-retry generate

### Requirement: Pre-stream destination-not-ready is a JSON gate not SSE

When generate returns HTTP 409 with code `destination_not_ready` before an event stream, the system MUST treat the body as a JSON error, MUST NOT parse it as SSE frames, and MUST show the API message plus a way back to home readiness (`/?destination=`). Other pre-stream failures (401, 422, 5xx, network) MUST show a typed error toast and panel, not an infinite spinner.

#### Scenario: Destination not ready

- **WHEN** generate returns 409 `destination_not_ready` as JSON
- **THEN** the UI shows that error plus a link to `/?destination=` and does not parse the body as SSE frames

#### Scenario: Pre-stream network or 5xx

- **WHEN** generate fails before a stream with a network error or 5xx
- **THEN** a typed error toast and panel are shown and the UI does not hang on a spinner

### Requirement: Progress may omit tool events

While streaming, the system MUST surface progress when `preferences_done`, `phase_changed`, `tool_*`, or `validation_done` events are present. A cache hit that omits `tool_*` events MUST NOT be treated as an error; progress MAY jump toward done.

#### Scenario: Cache hit without tool events

- **WHEN** the stream reaches a terminal without `tool_*` events
- **THEN** the UI does not show a tool-missing error and MAY jump toward done

### Requirement: Terminal itinerary_done navigates only with trip_id

On `itinerary_done`, the system MUST navigate to `/trips/{trip_id}` only when `trip_id` is a non-empty string. Missing `trip_id` MUST show an error panel and MUST NOT navigate to an undefined trip. The system MUST NOT treat the SSE itinerary blob as the long-term trip model and MUST NOT `GET /trips/{id}` in this phase. If day title or narrative is present on `itinerary_done`, the system MAY cache it in session UI state keyed by `trip_id`; a hard reload MAY lose that prose. The system MUST NOT invent a narrative API.

The `/trips/{id}` route MUST exist so navigation does not 404. It MUST be a stub in this phase (copy that trip detail lands later) and MUST NOT fetch trip HTTP.

#### Scenario: Itinerary done with trip id

- **WHEN** the stream yields `itinerary_done` with a non-empty `trip_id`
- **THEN** the app navigates to `/trips/{trip_id}` and that route is not a 404

#### Scenario: Itinerary done without trip id

- **WHEN** the stream yields `itinerary_done` without a non-empty `trip_id`
- **THEN** an error panel is shown and the app stays on `/generate`

#### Scenario: Hard reload may drop narrative

- **WHEN** the visitor reloads after `itinerary_done` that had day prose in session cache
- **THEN** missing prose is acceptable; the system MUST NOT fetch a narrative API

### Requirement: Stream error is terminal and not auto-retried

SSE `error`, including `generation_timeout` and `graph_recursion_limit`, MUST show a terminal error panel. The visitor MUST re-submit to generate again. The system MUST NOT auto-retry.

#### Scenario: Generation timeout

- **WHEN** the stream yields `error` with `generation_timeout` or `graph_recursion_limit`
- **THEN** a terminal error panel is shown and no second generate starts until the visitor submits again

### Requirement: Clarification is a fresh generate not a resume

`clarification_needed` is terminal and MUST NOT be treated as an error toast. The system MUST show the question inline (not a page-blocking modal) and MUST keep the original `raw_input` visible. On answer submit, the system MUST set `raw_input` to the original input, a newline, then the answer, and MUST start a **new** `POST /api/v1/planner/generate` with a new abort controller and progress reset to empty. The system MUST NOT call a resume endpoint.

Clarification `data` is not a generated schema. The system MUST parse JSON and prefer a `question` string when present; otherwise it MUST use a conservative string from known keys.

#### Scenario: Clarification shows inline

- **WHEN** the stream yields `clarification_needed`
- **THEN** an inline question is shown, original `raw_input` remains visible, and the event is not presented as a generate failure toast

#### Scenario: Clarification answer starts a new stream

- **WHEN** the visitor submits a clarification answer
- **THEN** a new `POST /api/v1/planner/generate` is sent whose `raw_input` contains the original text, a newline, and the answer, and progress starts from empty

### Requirement: Generate page does not own HTTP

The generate page MUST compose planner UI only. It MUST NOT call the JSON gateway, MUST NOT call `fetch` for generate, and MUST NOT use `EventSource`. Destinations MUST NOT import the planner stream client. Planner MUST NOT import destinations HTTP. Invalidating readiness by key tuple from the planner hook is allowed.

#### Scenario: Generate page does not fetch

- **WHEN** `/generate` renders compose (and later progress or clarification)
- **THEN** the page module does not call the JSON gateway, `fetch`, or `EventSource` directly
