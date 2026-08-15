## ADDED Requirements

### Requirement: Owner can add a stop from the places catalog

The system MUST allow an authenticated owner to add a stop to a day via `POST /api/v1/trips/{trip_id}/days/{day}/stops` with body `AddStopIn` `{ place_id }` as an API envelope whose `data` matches generated `TripOut`. Add-stop MUST use the places catalog picker (inline or sheet) for `place_id`. Guests MUST NOT successfully add — the control MUST be hidden or disabled, and HTTP 401 MUST surface a login CTA rather than a success toast. On success, trip detail and geojson caches for that trip MUST be refreshed so the day list and map update without inventing coordinates. Add mutations MUST NOT auto-retry. The trip detail page module MUST NOT call add mutations directly — it MUST mount feature UI only. The `/trips` list page MUST NOT gain day-edit controls.

#### Scenario: Add stop from picker

- **WHEN** an authenticated owner picks a catalog place and adds it to a day and the API returns success
- **THEN** that place appears in the day’s stops and trip/geojson views for that id are refreshed

#### Scenario: Guest cannot add

- **WHEN** a guest views trip detail add-stop controls
- **THEN** add is hidden or disabled and no anonymous POST expecting success is issued

### Requirement: Duplicate add surfaces conflict without silent duplication

When add-stop is refused because the place is already on that day (typically HTTP 409 plus `ErrorResponse`), the system MUST show distinct duplicate-conflict copy and MUST NOT silently duplicate the stop in the itinerary. The system MUST NOT invent a backend `duplicate_stop` code if OpenAPI only defines generic codes — map status plus `code` plus message/details.

#### Scenario: Add the same place again

- **WHEN** an owner adds a place that is already a stop on that day and the API returns 409 or equivalent conflict
- **THEN** duplicate-conflict copy is shown and the itinerary is not silently duplicated

### Requirement: Owner can reorder stops with move-up and move-down

The system MUST allow an authenticated owner to reorder a day’s stops via `PATCH /api/v1/trips/{trip_id}/days/{day}/stops/reorder` with body `ReorderStopsIn` `{ place_ids }` as an API envelope whose `data` matches generated `TripOut`. Reorder MUST be move-up / move-down that rebuilds `place_ids` for that day. On success, trip detail and geojson caches for that trip MUST be refreshed. Reorder mutations MUST NOT auto-retry. Guests MUST NOT successfully reorder.

#### Scenario: Move stop up or down

- **WHEN** an authenticated owner moves a stop up or down on a day and the API returns success
- **THEN** the day’s stop order matches the new `place_ids` and trip/geojson views for that id are refreshed

#### Scenario: Guest cannot reorder

- **WHEN** a guest views trip detail reorder controls
- **THEN** reorder is hidden or disabled and no anonymous PATCH expecting success is issued

### Requirement: Owner can remove a stop with confirm

The system MUST allow an authenticated owner to remove a stop via `DELETE /api/v1/trips/{trip_id}/days/{day}/stops/{place_id}` as an API envelope whose `data` matches generated `TripOut` (HTTP 200, not an empty 204 body). Destructive remove MUST require confirmation or an equivalent explicit control. On success, trip detail and geojson caches for that trip MUST be refreshed. Remove mutations MUST NOT auto-retry. Guests MUST NOT successfully remove.

#### Scenario: Remove stop after confirm

- **WHEN** an authenticated owner confirms remove and the API returns the updated trip envelope
- **THEN** that stop is gone from the day list and trip/geojson views for that id are refreshed

#### Scenario: Guest cannot remove

- **WHEN** a guest views trip detail remove controls
- **THEN** remove is hidden or disabled and no anonymous DELETE expecting success is issued

### Requirement: Owner can reoptimize a day without streaming

The system MUST allow an authenticated owner to reoptimize a day via `POST /api/v1/trips/{trip_id}/days/{day}/reoptimize` with no body, as an API envelope whose `data` matches generated `TripOut`. Reoptimize MUST be a JSON POST, not a browser EventSource stream and not the planner generate stream. On success, trip detail and geojson caches for that trip MUST be refreshed. Reoptimize mutations MUST NOT auto-retry. Guests MUST NOT successfully reoptimize. HTTP 503 or `llm_unavailable` MUST show a service-unavailable toast and MUST NOT require a frontend LLM key.

#### Scenario: Reoptimize succeeds

- **WHEN** an authenticated owner requests reoptimize and the API returns success
- **THEN** the day list reflects the returned trip and trip/geojson views for that id are refreshed

#### Scenario: Reoptimize LLM unavailable

- **WHEN** reoptimize returns 503 or `llm_unavailable`
- **THEN** a service-unavailable message is shown, the itinerary is not pretended saved as reoptimized, and no frontend LLM key is required

#### Scenario: Guest cannot reoptimize

- **WHEN** a guest views trip detail reoptimize controls
- **THEN** reoptimize is hidden or disabled and no anonymous POST expecting success is issued

### Requirement: Day-edit failures stay distinct and honest

Day-edit mutations MUST surface distinct copy by case and MUST NOT pretend the itinerary changed when the API refused the write. HTTP 401 or `unauthorized` MUST use a login CTA. HTTP 403 with guest or session-mismatch context MUST use different-session copy and MUST NOT offer login as the fix. HTTP 403 with authenticated ownership context MUST use distinct ownership copy. HTTP 422 or `validation_error` MUST toast from `details` (or equivalent API message) without a fake itinerary change. HTTP 429 or `rate_limit_exceeded` MUST show backoff messaging and briefly disable the edit CTA (trip-edit 20/min). Network or 5xx (other than mapped 503 reoptimize) MUST toast with manual retry only. The system MUST NOT invent backend error codes that OpenAPI does not define. `/trips/{id}` MUST remain Optional + ownership and MUST NOT gain a required-auth wrapper because edit exists.

#### Scenario: Edit while unauthenticated

- **WHEN** a guest is on trip detail or an edit returns 401 / `unauthorized`
- **THEN** edit is not presented as saved and a login path is used

#### Scenario: Edit session mismatch

- **WHEN** a day-edit mutation returns 403 with guest or session-mismatch context
- **THEN** different-session copy is shown and login is not offered as the fix

#### Scenario: Edit ownership forbidden

- **WHEN** a day-edit mutation returns 403 and the viewer is authenticated
- **THEN** ownership copy is shown and it is not the guest session-mismatch sentence

#### Scenario: Validation error

- **WHEN** a day-edit mutation returns 422 or `validation_error`
- **THEN** a toast from API details is shown and the itinerary is not pretended changed

#### Scenario: Trip-edit rate limited

- **WHEN** a day-edit mutation returns 429 or `rate_limit_exceeded`
- **THEN** backoff messaging is shown and the edit CTA is briefly disabled
