## Context

See `proposal.md` for why. Current FE (F6 as-built in `docs/app/system.md`) is a working cookie client: destinations search/readiness/prepare, planner POST SSE, trips CRUD/edit, MapLibre list-first, one shadcn `Button`, Geist, stacked `max-w-lg` pages, fetch-free `SessionHeader`. Visual SSOT for this change: `docs/feature_ui.md`. Wire SSOT remains `docs/frontendGuide.md`. Next.js App Router conventions for this repo live under `node_modules/next/dist/docs/` and MUST be read at apply time (this Next is not the training-data default).

Explore Nearby has **no** OpenAPI route. Backend `ST_DWithin` / radius helpers are internal to `guideagent` and MUST NOT be called from the FE by inventing a path. `PlaceOut` already has `name`, `category`, `summary`, `lat`, `lng`, `destination_id` — enough for live cards when a destination is known. It has **no** image URL.

## Goals / Non-Goals

**Goals:**

- Skin Plan / Generate / Trips with a shared product system without moving HTTP, Query keys, or SSE.
- Add `/explore` with a swappable in-feature feed provider: live places vs labeled preview.
- Keep modular boundaries (pages mount barrels; features do not import each other’s HTTP).
- Pull forward phone layouts and keyboard reachability; prove with Playwright MCP.

**Non-Goals:**

- Nearby/radius/reverse-geocode API, place photos, add-stop from Explore, chat planner, bookings, reviews.
- F7 Vitest / `@playwright/test` / Sentry, OAuth `FRONTEND_URL` bounce, regenerating OpenAPI types for new paths.

## Decisions

### 1. Product UI is a skin, not a rewrite

**Choice:** Restyle existing feature components in place (`features/destinations`, `planner`, `trips`, `auth`). Add `components/layout/` for shell/page frames and extra shadcn primitives. Do not move fetch into `app/` or a global `hooks/`.

**Why:** AGENTS.md modular-by-default; existing Query/SSE/error paths already proven.

**Alternatives:** New parallel route tree (`/v2`) — rejected (splits contracts). Dump screens into `components/` — rejected (violates feature folders).

### 2. Not a Layla chat shell

**Choice:** Large natural-language `raw_input` plus optional days/stay; lat/lng behind disclosure. Clarification stays a one-shot Q&A that re-POSTs generate.

**Why:** Blueprint principle 6 — trip is the durable artifact. Chat would invent a message API.

**Alternatives:** Full chat transcript UI wrapping SSE events as bubbles — rejected (implies resume/thread).

### 3. Explore data: adapter in the feature, not a fake `lib/api`

**Choice:** `features/explore` owns `ExploreFeedProvider`:

- `destinationId` present → `usePlaces(destinationId)` from the **places barrel** (existing `GET /places?destination_id=`).
- else → local preview catalog + optional `navigator.geolocation`.

No `lib/api/explore.ts` until OpenAPI has a route. Mock ids MUST be namespaced (`preview:`) and never passed to Wandr writes.

**Why:** Core-client forbids inventing endpoints. A fake HTTP module would look real and get copied.

**Alternatives:** (a) Only mock — weaker, ignores live `PlaceOut`. (b) Client-filter all destinations’ places — impossible without a list-all-places API. (c) Reverse-geocode GPS to `destination_id` — invented.

### 4. Photos are category art, not venue photography

**Choice:** Static category illustrations (in-repo or licensed placeholders) with honest alt. On error, gradient + Lucide icon. Never claim OSM fidelity.

**Why:** `PlaceOut` has no image field. Hotlinked Unsplash of “that cafe” would be misleading.

**Alternatives:** Skip images (less “Instagram”) — allowed as fallback if assets slip; cards still MUST work.

### 5. Header gains Explore + Trips; Search stays a home `Link`

**Choice:** Extend `SessionHeader` with `Link`s. Destinations typeahead on `/explore` is the destinations **barrel** on that page, not the header.

**Why:** Existing session-shell contract. Header must stay fetch-free and must not import destinations/trips HTTP.

### 6. Trip detail split / sheet is CSS + existing `TripMap` collapse

**Choice:** Wide: CSS grid (map sticky | timeline). Narrow: itinerary first; reuse collapse callback and/or a shadcn `Sheet`/`Tabs`. Do not build a second map stack. Do not synthesize GeoJSON from `PlaceOut`/`TripPlaceOut` coordinates.

**Why:** List-first is already specified; this is layout.

### 7. Packages

**Choice:** Add shadcn primitives as needed (`card`, `input`, `textarea`, `badge`, `tabs`, `sheet`, `skeleton`, `separator`, `dropdown-menu`). Optional second `next/font` family for display. No infinite-scroll library; no `@dnd-kit`; no chat SDK.

**Why:** Lightest viable; shadcn already configured (`components.json` base-nova).

### 8. Geolocation privacy

**Choice:** Request GPS only after an explicit “Use my location” control (not on every `/explore` mount). Denied/timeout → dedicated panel. Do not persist lat/lng in `localStorage`. Ephemeral React state is enough.

**Why:** Avoid surprise permission prompts; no new token/storage surface.

### 9. Proof

**Choice:** Playwright MCP against `http://localhost:3000` with API up: guest home search, generate abort still possible, trip 403 copy, explore live vs preview vs denied. Fail closed if API/MCP down.

**Why:** Matches F6 proof grain; do not install `@playwright/test` here.

## Risks / Trade-offs

- **[Risk] Restyle breaks 403/429/list-first copy** → Mitigation: preservation matrix in `docs/feature_ui.md` §8; Playwright checks copy, not only pixels.
- **[Risk] Mock cards look live** → Mitigation: mandatory Preview badge; mock ids never used on API writes.
- **[Risk] Category strings from OSM do not match Cafe/Park chips** → Mitigation: All chip always shows the full list; chips are contains/equality filters, not a rewritten taxonomy.
- **[Risk] Image hotlink failure** → Mitigation: local fallbacks; card usable without image.
- **[Risk] Header starts fetching trips for a badge count** → Mitigation: spec forbids trips HTTP in the header; Trips is a `Link` only.
- **[Risk] In-flight OpenSpec changes (`implement-fe-step-f6`)** → Mitigation: do not rewrite `lib/api/places.ts`; consume the barrel. If F6 is not merged, live explore waits on that barrel and preview still ships.
- **[Trade-off] GPS without destination cannot show real nearby OSM** → Accepted until OpenAPI nearby exists; product copy says Preview.
- **[Trade-off] `TripOut` has no destination name** → List cards stay days/status, not fake titles.

## Migration Plan

1. Tokens + shell + nav (Search contract unchanged) — can ship behind no flag; CSS-only rollback is revert.
2. Home + generate restyle — revert feature files if SSE/search regress.
3. Trips list/detail layout — revert layout if map/403 regress; keep hooks.
4. Explore feature + route — delete `app/explore` + `features/explore` to roll back the new surface.
5. Update `docs/app/system.md`. Keep `docs/feature_ui.md` as the visual SSOT.

No DB/API migration. No env migration.

## Open Questions

None that block apply. Place-photo strategy (in-repo vs remote placeholders) can be chosen at apply as long as alt text stays honest and cards work without images.
