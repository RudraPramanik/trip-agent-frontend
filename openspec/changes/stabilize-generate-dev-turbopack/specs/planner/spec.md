## MODIFIED Requirements

### Requirement: Guests can compose on generate without a login wall

The system MUST provide a compose surface at `/generate`. Guests MUST be able to open it (no required-auth wrapper). The compose `destination_id` MUST be seeded from the first non-empty trimmed value among query params `destination` (canonical, written by home/readiness) then `destination_id` (alias). The compose payload MUST match generated `PlanRequest`: required `destination_id` and `raw_input`, optional `days`, `base_lat`, `base_lng`, and `accommodation_label`. The system MUST NOT invent extra fields.

#### Scenario: Guest opens compose with a destination

- **WHEN** a guest opens `/generate?destination=` with a non-empty destination id
- **THEN** the compose form is shown and that destination id is used without the visitor retyping the uuid

#### Scenario: Guest opens compose with destination_id alias

- **WHEN** a guest opens `/generate` with empty or missing `destination` and a non-empty `destination_id` query param
- **THEN** the compose form is shown and that id is used as the compose destination

#### Scenario: destination wins over destination_id

- **WHEN** both `destination` and `destination_id` are non-empty and differ
- **THEN** compose uses the `destination` value

#### Scenario: Generate is not login-gated

- **WHEN** a guest opens `/generate` while unauthenticated
- **THEN** the page loads without a login wall

### Requirement: Invalid or missing compose does not start generate

Client-invalid compose MUST show visible field errors and MUST NOT request `POST /api/v1/planner/generate`. Trimmed `raw_input` length less than 1 is invalid. When neither `destination` nor `destination_id` yields a non-empty trimmed id, the system MUST show pick-a-destination copy with a way back to home, MUST NOT invent a destination uuid, and MUST NOT POST generate.

#### Scenario: Empty raw input

- **WHEN** the visitor submits compose with empty or whitespace-only `raw_input`
- **THEN** a visible field error is shown and the network has no `POST /api/v1/planner/generate`

#### Scenario: Missing destination query

- **WHEN** the visitor opens `/generate` with no usable `destination` or `destination_id` query value
- **THEN** pick-a-destination UI is shown, no compose POST is made, and no destination uuid is invented

#### Scenario: Empty destination_id alone is not a seed

- **WHEN** the visitor opens `/generate?destination_id=` with an empty value and no `destination`
- **THEN** pick-a-destination UI is shown and no destination uuid is invented
