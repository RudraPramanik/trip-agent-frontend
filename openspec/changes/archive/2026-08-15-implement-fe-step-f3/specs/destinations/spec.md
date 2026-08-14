## MODIFIED Requirements

### Requirement: Generate CTA does not start planner generate

The Generate control MUST remain enabled at every readiness tier shown. When a destination id is present, activating Generate MUST navigate to `/generate?destination=<id>`. It MUST NOT call `POST /api/v1/planner/generate`, MUST NOT open an SSE client, and MUST NOT import the planner stream client. Helper text MAY say compose is next. Destinations MUST NOT own the compose form.

#### Scenario: Generate click does not generate

- **WHEN** the visitor activates Generate on a selected destination (including `sparse`)
- **THEN** the app navigates to `/generate?destination=` with that destination’s id and the network has no `POST /api/v1/planner/generate` from that click

#### Scenario: Sparse Generate still navigates

- **WHEN** readiness succeeds with `tier` `sparse` and the visitor activates Generate
- **THEN** Generate is not disabled and navigation to `/generate?destination=` still occurs
