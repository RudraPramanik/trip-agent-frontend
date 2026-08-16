## Context

See proposal.md — Why. Current home is F2 search + warn-and-allow readiness: Generate is a `Link` to `/generate?destination=` at every tier, including `sparse`. `lib/api/destinations.ts` has search + readiness only. Generated `types/generated/api.d.ts` does **not** yet include `POST /destinations/{id}/prepare`. Compose already treats pre-stream 409 `destination_not_ready` as JSON and links back to `/?destination=`. `sendJson` uses `fetch` `res.ok` (2xx), so HTTP 202 with an `ApiResponse` already parses if we call it — unless we later special-case status === 200.

Wire SSOT after this change: `docs/frontendGuide.md` synced from `docs/update_backend.md`. Do not invent paths or DTO fields; regenerate OpenAPI types first.

## Goals / Non-Goals

**Goals:**
- Wire guest search → explicit prepare → poll readiness → Generate, matching the API floor (default 10).
- Keep modular layers: HTTP in `lib/api/destinations.ts`, hooks/UI in `features/destinations/`, pages mount barrels only.
- Preserve sparse warn-and-allow **when the floor is already met**.

**Non-Goals:**
- Auto-prepare on search or select.
- `radius_km` UI, country/region scrape, Google login polish, CLI ingest.
- Planner importing destinations HTTP, or moving compose onto home.
- Changing the JSON gateway’s default 20s timeout.
- Hand-editing `types/generated/api.d.ts`.

## Decisions

### 1. Gate Generate on `place_count`, not on `tier`

UI floor is **10**, matching API `PLANNER_ABSOLUTE_MIN_PLACES` default. `sparse` with `place_count >= 10` still enables Generate (F2 warn-and-allow). `place_count < 10` disables Generate and shows Prepare. 409 remains the authority if the API floor drifts.

**Alternative considered:** Disable Generate whenever `tier === "sparse"`. Rejected — contradicts F2 for destinations that already have enough places (limited/sparse with 10+ POIs still generate today).

**Alternative considered:** Keep Generate always enabled and rely on 409. Rejected — new geocoded shells would send guests to compose just to bounce back; the FE guide gates on `place_count`.

### 2. Explicit Prepare on the readiness card; no auto-prepare

Prepare is **5/min/IP**. Selecting search hits MUST NOT POST prepare. Omit the JSON body (API default `radius_km` 30).

**Alternative considered:** Auto-prepare on `?destination=` when below floor. Rejected — curious browsing would burn the limiter and start Overpass without intent.

**Alternative considered:** Radius slider. Rejected — out of scope; country/region polygons also out of scope.

### 3. Home owns prepare + poll; compose stays planner-only

`useMutation` for prepare (`retry: none`). On 202, set local preparing state and poll the existing `["destinations","readiness", id]` query (~2s `refetchInterval`, stop at floor or ~120s). On 200 `ready`, `invalidate`/`refetch` readiness once. Local React state on the card (not Zustand). Unmount stops polling.

`app/generate` does not mount destinations prepare. Deep-link under floor still 409s back to home. Planner MUST NOT import `lib/api/destinations`. 409 copy may say the place needs prepare.

**Alternative considered:** Generate page also prepares. Rejected — would mix destination HTTP into planner UI or duplicate the client; the documented flow is search → prepare → poll → compose.

### 4. Regenerated types, then `sendJson` for prepare

Apply starts with live `GET {API}/openapi.json` and `npm run gen:types`. Path key `"/api/v1/destinations/{destination_id}/prepare" satisfies keyof paths`. Types from `components["schemas"]` (`DestinationPrepareOut`, optional `PrepareIn`). If OpenAPI lacks the path, stop.

Use `sendJson` + `parse: "api"`. Confirm HTTP 202 still counts as `res.ok`; add a core-client 202 scenario so nobody later treats only 200 as success. Do **not** raise the 20s JSON timeout — prepare returns 200/202 quickly; wait is polling.

**Alternative considered:** Hand-mirror `DestinationPrepareOut` from the markdown guide until OpenAPI is up. Rejected — AGENTS.md: regenerate, don’t invent wire types.

### 5. Docs follow the API contract dump

Replace the destinations/planner/flow/DTO/rate-limit sections of `docs/frontendGuide.md` with the content already in `docs/update_backend.md` (canonical FE guide, not a second SSOT). Note in `docs/blueprint.md` Failure Boundary that 409 means prepare/poll, not login; F2.2 “never hard-block sparse” still holds **when the floor is met**. Snapshot `docs/app/system.md`.

## Risks / Trade-offs

- [Apply blocked because local OpenAPI has no prepare path] → Mitigation: first task is prove `/openapi.json` includes prepare; do not stub.
- [UI floor 10 drifts from API settings] → Mitigation: still handle 409; document 10 as the default mirror.
- [Overpass slow or thin coverage] → Mitigation: 120s cap then “not enough places”; first sparse poll is not failure.
- [Prepare 429] → Mitigation: existing toast + brief CTA disable; no retry loop.
- [Polling while user searches another place] → Mitigation: query key includes destination id; unmount/id change stops the previous interval.
- [Confusion with F2 “never hard-block sparse”] → Mitigation: Decision 1; specs distinguish floor vs tier.

## Migration Plan

1. API already shipped prepare — no FE feature flag.
2. Regenerate types, then destinations client + readiness UI, then docs.
3. Rollback: revert the FE change; API prepare can stay unused. Guests on old FE still 409 from compose.

## Open Questions

None. Radius UI, auto-prepare, and generate-page prepare were resolved as non-goals above.
