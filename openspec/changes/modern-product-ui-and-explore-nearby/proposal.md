## Why

Wandr’s F0–F6 skeleton already talks to the live API (search, readiness, SSE generate, trips, map, day-edit), but the UI is a stacked demo: `max-w-lg`, one shadcn Button, no product chrome. That undercuts a trip planner meant to sit next to Layla / TripAdvisor / Trip.com, and there is no place-discovery surface. We need a frontend-only product UI pass that keeps every existing contract, plus **Explore Nearby** as an Instagram-like feed — using the existing places catalog when a destination is selected, and a labeled preview mock when only GPS is available — because no nearby/radius API exists in OpenAPI yet.

## What Changes

- Author `docs/feature_ui.md` as the human SSOT for visual language, IA, and Explore Nearby data rules (already drafted; apply must follow it).
- Add a **product shell**: travel design tokens, display type, sticky nav (Plan/Search, Explore, Trips), responsive layouts. Restyle home, generate, trips list, and trip detail **without** changing HTTP, SSE, Query keys, or failure copy.
- Add **`/explore`**: guest-unblocked location feed (category chips, photo-forward cards). Live mode = existing `GET /places?destination_id=` via the places barrel. GPS-only mode = labeled Preview mock. No invented nearby endpoint, no `lib/api` module for a route that is not in OpenAPI.
- Header Search stays a home navigation link (no typeahead HTTP). Header stays fetch-free aside from composing the existing session probe / login / logout.
- Proof with Playwright MCP on existing flows plus explore empty/live/preview states. **Not breaking** for wire contracts. No F7 Vitest / `@playwright/test` / Sentry. No backend changes.

## Capabilities

### New Capabilities

- `product-ui`: Shared product chrome, tokens, and screen layouts so Plan / Generate / Trips feel like a modern trip platform while remaining list-first, honest-empty, and modular.
- `explore-nearby`: Guest `/explore` feed — destination-anchored live places, GPS permission + preview mock, category chips, honest photos/IDs, CTAs into existing Plan/Generate (no add-stop from explore, no invented nearby HTTP).

### Modified Capabilities

- `session-shell`: Product header MUST add Explore and Trips navigation while keeping brand, Search-as-home-link, guest-unblocked chrome, and no destinations/trips HTTP in the header.
- `trips`: Trip detail MUST use a product itinerary layout (desktop split map|timeline, mobile list-first / map sheet) without weakening 403/404/map/narrative/day-edit contracts.

## Impact

- **Touched:** `docs/feature_ui.md`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx` (layout only), new `app/explore/page.tsx`, `features/auth/session-header.tsx`, restyle under `features/destinations`, `features/planner`, `features/trips`, `features/places` (card presentation; barrel only), new `features/explore/*`, `components/ui/*` (additional shadcn primitives), `components/layout/*`, `docs/app/system.md` at ship. Optional `next/font` display family.
- **Not touched:** FastAPI, `lib/api/client.ts` contracts, `lib/sse/planner.ts` protocol, generated `types/generated/api.d.ts` (no new paths), `AGENTS.md` hard rules, OAuth bounce, F7 test infra.
- **APIs / deps:** No new Wandr API. Live explore uses existing `GET /api/v1/places?destination_id=` (None auth, paginated `PlaceOut`). Destinations search on explore composes the destinations **barrel**. Geolocation is the browser API only. New npm: only shadcn primitives justified at apply (card, input, badge, tabs, sheet, skeleton, etc.). No infinite-scroll/Instagram kits, no chat SDK.
- **Env:** still `NEXT_PUBLIC_API_URL` + optional `NEXT_PUBLIC_MAP_STYLE_URL` only.
- **Follow-up (out of scope):** when OpenAPI gains a nearby route, regenerate types, add `lib/api` method, swap the explore provider, retire the mock.
