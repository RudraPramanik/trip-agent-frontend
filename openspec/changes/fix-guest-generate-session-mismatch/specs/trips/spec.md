## ADDED Requirements

### Requirement: Guest forbidden panel explains session and host traps

When trip GET returns 403 and the viewer is a guest, the existing session-mismatch copy MUST remain (no login CTA). The panel MUST also tell the visitor to open a trip generated in this browser session, or generate a new one. When the page hostname differs from the configured API origin hostname, the same panel MUST include the host-mismatch hint (use the same host for the app and the API). When hostnames match, that host hint MUST NOT appear. The system MUST NOT invent a backend session-mismatch error code and MUST NOT read `wandr_session` from JavaScript.

#### Scenario: Guest 403 with matching hosts

- **WHEN** trip GET returns 403, the viewer is a guest, and the page hostname matches the API origin hostname
- **THEN** session-mismatch copy is shown, no login CTA is offered, generate-in-this-session guidance is shown, and the host-mismatch hint is omitted

#### Scenario: Guest 403 with host mismatch

- **WHEN** trip GET returns 403, the viewer is a guest, and the page hostname differs from the API origin hostname
- **THEN** session-mismatch copy is shown with no login CTA, and the host-mismatch hint is visible
