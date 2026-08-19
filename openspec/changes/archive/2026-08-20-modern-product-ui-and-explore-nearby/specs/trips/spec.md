## ADDED Requirements

### Requirement: Trip detail uses a product itinerary layout without weakening list-first map rules

Trip detail MUST present days and stops as a product itinerary (timeline or equivalent), not only a stacked developer dump. On a wide viewport the map MAY sit beside the itinerary; on a narrow viewport the day list MUST remain the primary surface and the map MUST be secondary (collapsed, tab, or sheet). Map, GeoJSON, 403, 404, empty-places, markdown-only narrative, claim, delete, and owner day-edit contracts already specified for this capability MUST still hold: missing LineStrings MUST NOT invent routes; tile or style failure MUST keep the day list usable; guest session-mismatch 403 MUST remain distinct from authenticated ownership 403 and MUST NOT gain a login CTA; narrative MUST stay `react-markdown` + GFM without raw HTML. The trip page module MUST still mount feature UI only.

#### Scenario: Wide viewport can split map and itinerary

- **WHEN** a visitor opens an accessible trip on a wide viewport and geojson has features and the map is shown
- **THEN** the itinerary (days/stops) remains visible beside or with the map and stops still come from `TripOut.places`

#### Scenario: Narrow viewport keeps the day list primary

- **WHEN** a visitor opens an accessible trip on a narrow viewport
- **THEN** the day list is reachable without depending on the map remaining expanded

#### Scenario: Map failure still leaves the itinerary

- **WHEN** the map style URL is unset, broken, or tiles fail after a successful trip GET
- **THEN** the map collapses or hides and the product itinerary remains usable

#### Scenario: Forbidden copy stays distinct under the new layout

- **WHEN** trip GET returns 403 and the viewer is a guest
- **THEN** session-mismatch copy is shown in the product empty/error layout and no login CTA is offered
