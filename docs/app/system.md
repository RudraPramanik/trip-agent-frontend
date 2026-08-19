# Wandr FE — system (product UI + Explore Nearby)

Snapshot after the `modern-product-ui-and-explore-nearby` apply. Product SSOT: [`docs/blueprint.md`](../blueprint.md). Visual SSOT: [`docs/feature_ui.md`](../feature_ui.md). Guardrails: [`AGENTS.md`](../../AGENTS.md). Wire: [`docs/frontendGuide.md`](../frontendGuide.md).

This is not a second bible. Update it when a phase ships.

This is not a second bible. Update it when a phase ships.

## Stack

Next.js App Router (this repo **is** the app), React, TypeScript strict, Tailwind v4, shadcn (Button, Card, Input, Textarea, Badge, Tabs, Sheet, Skeleton, Separator), TanStack Query, Sonner, react-hook-form, Zod, `@hookform/resolvers`, Zustand (narrative Option A), **react-markdown** + **remark-gfm**, **maplibre-gl**, `next/font` Geist + Fraunces. npm, Node `>=20`. No NextAuth / Better Auth, no `rehype-raw`, no Vitest/`@playwright/test` in this phase. **No `lib/api/explore.ts`.** Last-step browser proof uses Playwright MCP, not `@playwright/test`.

## Env

- `.env.example`: `NEXT_PUBLIC_API_URL` (required), optional `NEXT_PUBLIC_MAP_STYLE_URL` (MapTiler or other style JSON URL)
- F6 needs **`NEXT_PUBLIC_API_URL` only** — no new FE API keys. Map style remains optional (F4). Reoptimize is a JSON POST; LLM keys stay on the API process
- `lib/config.ts`: `getPublicApiUrl()` throws if missing; `getMapStyleUrl()` optional
- Copy to `.env.local` (not committed). If `localhost:8000` is not the Wandr API (IPv6/Docker collision), set `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`
- Missing map style: development may use MapLibre demo/OSM-compatible fallback with helper text; production collapses the map (list-first)

## HTTP

- `types/generated/api.d.ts` — OpenAPI types; regenerate with `npm run gen:types` (API must be up)
- `types/trip-geojson.ts` — thin FeatureCollection narrow for trip GeoJSON (not generated)
- `lib/api/client.ts` — only gateway: `credentials: "include"`, AbortSignal (default 20s), GET retry once, no mutation retry; `parse: "api" | "paginated" | "raw" | "empty"`
- `lib/api/errors.ts` — `NetworkError` / `ApiError`
- `lib/api/health.ts` — `GET /api/v1/health`
- `lib/api/auth.ts` — `getMe` and `logout`
- `lib/api/destinations.ts` — search + readiness + prepare (`POST /destinations/{id}/prepare`, omit body; HTTP 202 success envelope is OK)
- `lib/api/places.ts` — `listPlaces` (`parse: "paginated"` → `PlaceOut`). No trip-edit here. `getPlace` not added (list row is enough)
- `lib/api/trips.ts` — `getTrip` (`parse: "api"`), `getTripGeojson` (`parse: "raw"`), `listTrips` (`parse: "paginated"`), `claimTrip` (`parse: "api"`), `deleteTrip` (`parse: "empty"` / HTTP 204), `reorderDayStops` PATCH, `addDayStop` POST, `removeDayStop` DELETE (`parse: "api"` / HTTP 200 TripOut, **not** 204), `reoptimizeDay` POST no body (JSON, not SSE)
- Domain stub (empty): `planner.ts` — generate is **not** envelope JSON; planner generate uses SSE in `lib/sse/planner.ts`

## Places (F6.2)

- `features/places/use-places.ts` — Query key `["places", destinationId]`; `enabled` when destination id is non-empty; retry 1; AbortSignal
- `features/places/places-picker.tsx` — catalog from `GET /places?destination_id=` (not `TripOut.places`); empty UI; 404 panel; retry on 5xx. Optional `onSelect` for add-stop
- `features/places/index.ts` — public barrel (`PlacesPicker`, `usePlaces`)
- Wired on trip detail after trip GET success. 404/empty/network MUST NOT blank the day list. Places GET is public (None auth)

## Trips (F4 + F5 + F6)

### Detail + map (F4)

- `features/trips/use-trip.ts` — Query key `["trips", id]`; retry 1; AbortSignal
- `features/trips/use-trip-geojson.ts` — Query key `["trips", id, "geojson"]`; enabled only after trip GET success
- `features/trips/trip-detail.tsx` — days/stops from `TripOut.places`; prefs chips; empty day UI; claim + delete; day-edit + add-stop
- `features/trips/day-narrative.tsx` — Option A overlay via `react-markdown` + `remark-gfm` only (no `rehype-raw` / `dangerouslySetInnerHTML`)
- `features/trips/trip-forbidden.tsx` — guest session-mismatch vs authenticated ownership (viewer context via `useAuthMe`); guest path has **no** login CTA
- `features/trips/trip-not-found.tsx` — 404 panel
- `features/trips/trip-map.tsx` — MapLibre Client Component; Points + LineStrings from GeoJSON only; never invent coordinates; style/tile failure → collapse; OSM/demo fallback **dev only**
- `features/trips/trip-page.tsx` / `index.ts` — page-facing barrel; mounts `PlacesPicker` from the places barrel (MUST NOT import `lib/api/places`)
- `app/trips/[id]/page.tsx` — Server Component; awaits `params`; mounts trips barrel only (no `getJson` / `useQuery` / MapLibre / mutations)

### List / claim / delete (F5)

- `features/trips/use-trips-list.ts` — Query key `["trips","list", page, size]`; `enabled` when authenticated; retry 1
- `features/trips/trips-list.tsx` — items → links to `/trips/{id}`; empty UI; guest/401 → login CTA (no fake list)
- `features/trips/use-claim-trip.ts` — mutation `retry: false`; invalidate list + trip (+ geojson)
- `features/trips/claim-trip-button.tsx` — primary CTA on detail for unclaimed; guest → login path; distinct failure copy (401 / session-mismatch / already-claimed). Claim best-effort until API `FRONTEND_URL` bounce
- `features/trips/use-delete-trip.ts` — mutation `retry: false`; drop list + trip + geojson; optional navigate to `/trips`
- `features/trips/delete-trip-control.tsx` — confirm; no anonymous delete; 403 vs 404 copy
- `app/trips/page.tsx` — Server Component; mounts `TripsList` only (no `getJson` / `useQuery` / `sendJson`). No day-edit on the list

### Day edit (F6.1)

- `features/trips/use-reorder-stops.ts` / `use-add-stop.ts` / `use-remove-stop.ts` / `use-reoptimize-day.ts` — `useMutation`; `retry: false`; onSuccess `setQueryData(["trips", id])` + invalidate geojson (+ list). No optimistic UI
- `features/trips/add-stop-control.tsx` — owner-gated; opens places picker (inline); `AddStopIn.place_id` from catalog `PlaceOut.id`; 409 duplicate-conflict copy
- `features/trips/day-edit-controls.tsx` — up/down reorder (`ReorderStopsIn.place_ids`); remove with confirm; reoptimize JSON POST (not EventSource / planner SSE). Guest: hidden/disabled + login path
- Distinct 401 / 403-guest (no login-as-fix) / 403-owner / 409 / 422 / 429 (backoff + brief CTA disable) / 503 `llm_unavailable` (no FE LLM key)
- Trips MAY import `PlacesPicker` from the places barrel and `useAuthMe` from the auth barrel. MUST NOT import `lib/api/places` or `lib/api/auth`

## Planner SSE (F3)

- `lib/sse/planner.ts` — `POST /api/v1/planner/generate` via raw `fetch` + `ReadableStream` parser; terminals navigate to `/trips/{trip_id}` when present
- `features/planner/*` — compose, progress, clarification; MUST NOT `GET /trips/{id}`
- `store/narrative.ts` — thin Zustand Option A: day title/narrative keyed by `trip_id`; hard reload may drop prose

## Auth / session

FastAPI owns cookies (`wandr_session`, `wandr_token`). FE never stores tokens in `localStorage` / `sessionStorage` / readable JS cookies.

- `features/auth/use-auth-me.ts` — Query key `["auth","me"]`; trips may import from the auth **barrel** for list gates, claim/delete/edit gates, and 403 viewer context
- `/trips/[id]` and `/generate` have no required-auth wrapper; `/trips` list is gated in UI (login CTA for guests)
- `session-header.tsx` stays fetch-free of trips and places HTTP

## Destinations

Search + readiness + guest Prepare. Search does **not** scrape. Selecting a result writes `?destination=` and does **not** POST prepare.

- `features/destinations/use-destination-readiness.ts` — Query key `["destinations","readiness", id]`; optional poll ~2s while preparing; stop at `place_count >= 10` or ~120s
- `features/destinations/use-destination-prepare.ts` — mutation `retry: false`; invalidate readiness on 200 `ready`
- `features/destinations/readiness-card.tsx` — Generate `Link` to `/generate?destination=<id>` only when `place_count` meets the planner floor (default 10). Below the floor: Prepare CTA (no login wall). `sparse` with enough places still generates. Destinations does **not** import trips HTTP or planner SSE.

## UI shell

- `providers/app-providers.tsx` — QueryClient + Sonner
- `components/layout/` — `SiteShell` (sticky header slot) + `PageFrame` (content width)
- `app/layout.tsx` — `AppProviders` → `SiteShell` + `SessionHeader` → `{children}`; **no** required-auth wrapper
- `session-header.tsx` — brand, Search (`Link` to `/#destination-search`), Explore (`/explore`), Trips (`/trips`), chip, Login/Logout. Fetch-free of destinations/places/trips/planner HTTP; Search is not a typeahead
- `app/page.tsx` — home hero + destinations barrel only
- `app/explore/page.tsx` — Server Component; mounts explore barrel only
- Travel tokens in `app/globals.css` (warm paper + forest primary). Display font: Fraunces via `--font-display`

## Explore Nearby

Frontend-only discovery at `/explore`. Guest-unblocked. **No nearby/radius HTTP.**

- `features/explore/` — `ExplorePage`, live feed via places **barrel** (`usePlaces`), preview mock (`preview:` ids), geolocation only after “Use my location”
- Live: `?destination=` → `GET /api/v1/places?destination_id=` (existing catalog). Category chips filter `PlaceOut.category`. CTA uses real `destination_id` to home/generate. No day-edit from explore
- Preview: GPS without destination → labeled **Preview** cards; CTA is `Link` to `/`; mock ids never sent as Wandr UUIDs. Denied/unavailable → dedicated panel + destination search still available
- Photos: category gradient illustrations with honest copy (not venue photography). `PlaceOut.summary` as text, not HTML
- MUST NOT import `lib/api/places` or `lib/api/destinations` from explore; compose barrels only

## Feature folders

`features/auth`, `features/destinations`, `features/planner`, `features/trips`, `features/places`, and `features/explore` are filled.

## Failure modes (F4 + F5 + F6)

| Case | Behavior |
|------|----------|
| 404 / `not_found` trip | Dedicated not-found panel |
| 403 guest session mismatch | Distinct copy; **no** login CTA |
| 403 ownership (authenticated) | Distinct ownership copy |
| Missing Option A narrative | Omit prose; still show days/stops |
| Empty `places` | Empty UI; no fake stops |
| Trip GET network / 5xx | Toast + retry; no infinite spinner |
| Missing LineStrings | Points only; never invent coordinates |
| Empty / bad GeoJSON | No overlay; day list remains |
| Tile / style failure | Collapse map; day list remains |
| Missing style URL (production) | Collapse map; do not use OSM |
| Missing style URL (development) | Demo/OSM-compatible fallback + helper text |
| GeoJSON 404/5xx | Toast; map collapsed; list still shown |
| 401 / guest on `/trips` list | Login CTA; no fake guest list |
| Empty trip list | Empty UI; never invent trips |
| Claim while guest / 401 | Login CTA; do not pretend claimed |
| Claim session mismatch | Distinct session-mismatch copy; no login-as-fix |
| Claim already-claimed / conflict | Distinct already-claimed / cannot-claim copy |
| Delete while guest | Disabled + login gate; no anonymous DELETE |
| Delete 403 | Ownership/forbidden copy; do not pretend deleted |
| Delete 404 | Already-gone; refresh list |
| Delete 204 | Drop list + detail (+ geojson) cache; navigate away from detail |
| Places 404 / `not_found` | Picker error/empty; day list stays |
| Places empty `items` | Empty picker; never invent places |
| Places network / 5xx | Toast + picker retry; day list stays |
| Edit while guest / 401 | Hidden/disabled controls; login CTA; do not pretend saved |
| Edit 403 guest session mismatch | Distinct session-mismatch copy; **no** login-as-fix |
| Edit 403 authenticated ownership | Distinct ownership copy |
| Add 409 duplicate / conflict | Duplicate-conflict copy; itinerary not silently duplicated |
| Edit 422 / `validation_error` | Toast from `details`; no fake itinerary change |
| Edit 429 / `rate_limit_exceeded` | Backoff toast; brief CTA disable (20/min) |
| Reoptimize 503 / `llm_unavailable` | Service-unavailable toast; no FE LLM key |
| Destination below place floor | Prepare + poll; Generate disabled; no login wall |
| Prepare 202 | Poll readiness ~2s up to ~120s; first sparse poll is not failure |
| Prepare 429 | Backoff toast; brief Prepare disable |
| Generate 409 `destination_not_ready` | JSON panel (not SSE); link home to prepare; **no** login CTA |
| Explore without destination | Search + optional GPS; no invented nearby HTTP |
| Explore GPS denied / unavailable | Dedicated panel; destination search remains |
| Explore preview cards | Visible Preview badge; ids not used as `destination_id` / `place_id` |
| Explore live empty / 404 / 5xx | Empty or retry in the feed; no invented places |

## Not built yet

Vitest / `@playwright/test` CI, Sentry (F7). Nearby/radius API (backend). Add-to-trip from Explore. Chat planner. No `@dnd-kit`. No optimistic UI.
