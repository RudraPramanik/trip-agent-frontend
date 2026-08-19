# Wandr — Product UI & Explore Nearby

> Feature clarification for the first **product-grade** frontend pass. OpenSpec change: `modern-product-ui-and-explore-nearby`.
> Wire contract stays `docs/frontendGuide.md`. Coding guardrails stay `AGENTS.md`. This file does **not** invent API routes, DTO fields, or env vars.

**Status:** applied (`modern-product-ui-and-explore-nearby`).

---

## 1. Goal

The app already has a working skeleton: destination search, readiness/prepare, planner SSE generate, trip list/detail/map, claim/delete, day-edit, places catalog. It looks like a developer demo.

This change makes Wandr feel like a modern trip platform (Layla / TripAdvisor / Trip.com class) **without breaking those features** and adds **Explore Nearby** as a location-based, Instagram-like discovery feed.

**Frontend only.** The nearby/radius API is not implemented on the backend. Explore Nearby must ship as UI + a swappable data adapter. Destination-anchored cards may use the **existing** `GET /api/v1/places?destination_id=` catalog. GPS-only browsing uses a **labeled preview (mock)** until a real nearby endpoint exists.

---

## 2. Constraints (non-negotiable)

| Must keep | Must not |
|-----------|----------|
| All current routes and query contracts (`?destination=`, `/generate?destination=`, `/trips`, `/trips/{id}`) | Invent endpoints, DTO fields, or eval HTTP clients |
| Cookie auth (`GET /auth/me`, Google navigate, logout via gateway) | Tokens in `localStorage` / readable JS cookies / NextAuth |
| SSE generate: POST `fetch` + `AbortController`, no `EventSource`, no auto-retry | Treat the SSE blob as the durable trip |
| Distinct 403 guest-session vs owner; list-first map; markdown-only narrative | `rehype-raw` / `dangerouslySetInnerHTML` for LLM prose |
| Modular folders: HTTP in `lib/api/{domain}`; UI/hooks in `features/{domain}`; pages mount barrels | Fetch / Query keys in `app/page.tsx` or the header |
| Header Search = navigation to home (no typeahead HTTP) | Header calling destinations or trips HTTP |
| Guest path unblocked for Home, Search, Generate, trip detail, Explore | Login walls on those surfaces |

---

## 3. What we borrow from competitors (and what we refuse)

Wandr is **trip-first**, not a chat shell (blueprint principle 6: the trip is the durable artifact).

| Reference | Borrow | Do not copy |
|-----------|--------|-------------|
| **Layla** | Warm editorial type, large natural-language prompt, itinerary as a designed object, clarification as a conversation beat | Full chat workspace as the product; booking marketplace |
| **Trip.com** | Hero destination search, dense travel chrome, primary CTA above the fold, destination as a “place card” | Flight/hotel inventory, dense promo tiles, invented catalog |
| **TripAdvisor** | Photo-forward discovery cards, category chips, “near me” mental model | Reviews, ratings, UGC, social graph |
| **Instagram** (Explore Nearby only) | Masonry/card feed, full-bleed imagery, category story, location header | Likes, follows, stories, infinite dark-pattern scroll |

---

## 4. Information architecture

```
Sticky shell
  Wandr (home) · Search · Explore · Trips · [Guest|User] · Login/Logout

/                     Plan — hero search + destination readiness
/generate             Compose — prompt + optional trip knobs + SSE progress
/explore              Explore Nearby — location feed
/trips                My trips (auth-gated list, unchanged contract)
/trips/[id]           Trip — map + day timeline (list-first)
/dev/ui               Keep as scratch; not in product nav
```

**Search** in the header remains a `Link` to `/#destination-search` (or `/`). It MUST NOT render a typeahead and MUST NOT call `GET /destinations/search`. Real search stays on Home (and may be **composed** on Explore as destinations feature UI, not as header HTTP).

**Explore** is guest-reachable. No required-auth wrapper.

---

## 5. Design system

### 5.1 Visual language

- **Light-first travel UI.** Warm paper background, deep forest/teal primary, terracotta/amber for sparse warnings (already used). Dark tokens may exist but are not the launch look.
- **Type:** keep Geist for UI/body. Add one **display** family for hero/itinerary titles (e.g. a serif or distinctive geometric already loadable via `next/font`). Do not mix more than two families.
- **Radius & elevation:** large cards (xl/2xl), soft shadows, photo overlays with scrims — not 1px zinc boxes stacked in `max-w-lg`.
- **Motion:** short (150–250ms) opacity/transform on cards and sheets. No decorative Lottie. SSE progress may animate a stepper, not a raw log dump.
- **Imagery honesty:** `PlaceOut` has **no image URL**. Cards use category illustrations or stock with alt text that does **not** claim to be a photo of that OSM venue. Failed image → gradient + Lucide icon. Never `dangerouslySetInnerHTML` for captions.

### 5.2 Primitives

Extend the existing shadcn (base-nova) kit only as needed: `card`, `input`, `textarea`, `badge`, `tabs`, `sheet`, `dialog`, `skeleton`, `separator`, `dropdown-menu`. Reuse `Button`, Sonner, Lucide.

**No** Instagram-clone kits, infinite-scroll packages, Redux, AI chat SDKs, or map products other than the existing MapLibre path.

Layout primitives live in `components/` (or `components/ui/` + a thin `components/layout/`). Feature screens stay in `features/{domain}`.

### 5.3 Responsive (pulled forward from F7.6 intent, not F7 test infra)

| Breakpoint | Shell | Trip detail | Explore |
|------------|-------|-------------|---------|
| ≥1024 | Horizontal nav | Split: sticky map \| timeline | 3-col masonry |
| 768–1023 | Horizontal, wrap | Stack: map ~40vh then list | 2-col |
| ≤767 | Compact nav or bottom tabs for Plan / Explore / Trips | List-first; map in a sheet/tab; no horizontal page scroll | 1-col feed |

Keyboard: all primary CTAs reachable; SSE progress region `aria-live="polite"` (existing F7.5 intent). Do **not** add Vitest / `@playwright/test` / Sentry in this change.

---

## 6. Screens — existing features, new skin

Behavior below is **visual/IA**. Wire, Query keys, abort, and error copy stay as today unless a row says otherwise.

### 6.1 Shell (`features/auth` + layout)

- Sticky, translucent header; brand wordmark; nav: Search, Explore, Trips.
- Session chip stays; Login helper about `FRONTEND_URL` bounce stays (can be visually quieter, not removed).
- Header remains **fetch-free** (composes `useAuthMe` / login / logout only).
- `/dev/ui` stays out of nav.

### 6.2 Home — Plan (`features/destinations`)

**Hero** (Trip.com / Layla energy):

- Full-width panel: headline (“Plan a trip that actually fits the place”), supporting line, large search field (min 2 chars, ~300ms debounce, 429 disable ~2s — unchanged).
- Results as destination **rows/cards** (`display_name`, `country`) — still only real `DestinationOut`. Empty: “No destinations match”. Error + retry. No invented destinations.

**After `?destination=`:**

- Destination **place card**: name from the selected result when still in memory; otherwise readiness fields only (do not invent a name endpoint).
- Readiness shown as status (tier chip, place count, enriched/indexed as secondary), not a raw `dl` of internals as the only UI.
- **Prepare** when below planner floor (~10 places) — same guest-allowed mutation, poll, timeout copy.
- **Generate** when at floor — `Link` to `/generate?destination=<id>` only. Sparse: warn-and-allow, Generate not disabled. 404 destination: not-found panel, no fake metrics.

Home page module still mounts destinations barrel only.

### 6.3 Compose (`features/planner`)

- Destination context as a chip/link back to `/?destination=`.
- **Primary:** large “What kind of trip?” prompt (`raw_input`).
- **Secondary (visible):** days, stay label.
- **Advanced disclosure:** `base_lat` / `base_lng` (keep fields; hide GIS look from the default view).
- Host-mismatch warning kept.
- Streaming: journey **stepper** driven by existing events (`preferences_done`, `phase_changed`, `tool_*`, `validation_done`). Cache hit without `tool_*` is still OK. Cancel aborts fetch.
- 409 `destination_not_ready`: gate panel + back to home (not SSE).
- `clarification_needed`: designed Q&A card; submit = **fresh** POST with original input + newline + answer.
- After `itinerary_done`: navigate `/trips/{trip_id}` only when `trip_id` present. Option A narrative cache unchanged.

Generate page still mounts planner barrel only.

### 6.4 My trips (`features/trips` list)

- Guest/401: illustrated empty + Login CTA (existing copy, including OAuth bounce helper).
- Authenticated empty: CTA back to Plan.
- Items as **cards**: days, status, link to detail, delete control. Do not invent destination names (TripOut has `destination_id` only). Optional: tiny placeholder art by day count — not fake titles.

### 6.5 Trip detail (`features/trips` + `features/places`)

**Desktop:** two columns — map (sticky) | itinerary.

**Mobile:** itinerary first; map in a tab/sheet. Tile/style/GeoJSON failure still **collapses the map** and keeps the day list.

Itinerary:

- Trip header: status, days, preference chips, claim + delete.
- Days as a **timeline**: stop name, time, arrival note; narrative via `react-markdown` + `remark-gfm` only.
- Empty days/stops: honest empty, no fake stops.
- Owner day-edit + add-stop remain; guest disabled + login path; same 401/403-guest/403-owner/409/422/429/503 copy.
- Places catalog restyled as compact cards (name, category) for add-stop — still `GET /places?destination_id=` from the places barrel. 404/empty/network must not blank the day list.

Forbidden / not-found panels keep distinct copy; they may use the new empty-state layout.

---

## 7. Explore Nearby (new)

### 7.1 Product

A location-based discovery feed: parks, viewpoints, cafes, and other place categories, in a photo-forward card stream. Guests can browse. Planning a trip still goes through the existing destination → readiness → generate path.

Route: **`/explore`**. Optional query: `?destination=<id>` (same id as home, so a user can Plan then Explore the same place).

### 7.2 Data rules (the important part)

There is **no** nearby/radius HTTP in OpenAPI. Do not add `lib/api/explore.ts` that `fetch`es a fake `/nearby`.

| Mode | When | Source | Photos | IDs |
|------|------|--------|--------|-----|
| **Live destination** | `destination` query is a real id | `GET /api/v1/places?destination_id=` via **places barrel** (`usePlaces`) | Category illustration/stock; honest alt | Real `PlaceOut.id` / `destination_id` |
| **Preview (mock)** | GPS granted but no destination, or destination unknown | Local mock in `features/explore/` | Same category art | **Not** UUIDs used as API ids |
| **Onboarding** | No destination, GPS denied/unavailable | Empty + CTAs: search destination (destinations UI) or “Use my location” | — | — |

**Adapter:** `ExploreFeedProvider` in the explore feature (not `lib/api`). Methods conceptually: `list({ destinationId?, origin?, category? })`. Live branch calls existing places hooks; mock branch returns static items. When a real nearby API ships later, add `lib/api/{domain}.ts` from OpenAPI and swap the provider — do not pre-invent the path.

**GPS:** browser `navigator.geolocation` only. Permission denied / insecure origin / timeout → dedicated panel, not a generic toast storm. Optional: if both GPS and a destination exist, **sort** live `PlaceOut` by haversine using `PlaceOut.lat/lng` vs the device point. That is client-side on data we already have — not a new API. Do **not** reverse-geocode GPS into a `destination_id`.

**Categories:** chips All, Cafe, Park, Viewpoint, and More. Filter live items by `PlaceOut.category` as returned (case-insensitive contains/equality). Unknown API categories appear under All / More — do not rewrite the backend taxonomy.

**Pagination:** use existing places page size if the hook already pages; otherwise show the returned `items` and a “load more” only if the paginated envelope has more. Mock: bounded list (~24), “end of preview” — no fake infinite scroll.

### 7.3 Feed UI

- Location header: “Near {destination display_name}” when selected; else “Near you” (preview) or “Pick a place to explore”.
- Masonry or even card grid (Instagram energy, not a table).
- Card: image/illustration, category badge, name, optional summary (`PlaceOut.summary` when present), optional distance when origin exists.
- Mock cards: visible **Preview** badge.
- Empty live catalog: same honesty as places picker (“No places in the catalog…”).
- Places 404/5xx: error + retry in the feed; do not crash the shell.
- 429 on destinations search (if search is composed on this page): existing toast + brief disable.

### 7.4 Actions from a card

| Card kind | Primary CTA | Must not |
|-----------|-------------|----------|
| Live `PlaceOut` | “Plan this destination” → `/?destination=` or `/generate?destination=` (readiness floor still applies on home) | Invent add-to-trip without an open owned trip |
| Live `PlaceOut` while a trip is **not** open | Do not call add-stop | POST day-edit from Explore |
| Mock | “Search this name on Plan” → home search query or copy; never navigate with a fake uuid | Treat mock id as `place_id` / `destination_id` |

v1 does **not** add-stop from Explore (add-stop is owner-only on `/trips/{id}`). Deep-link “add this place to a trip” is a later change.

Explore page module mounts explore (+ destinations search UI via **barrel**, not `lib/api/destinations`). Explore MUST NOT import `lib/api/places`; it MAY import `usePlaces` / card bits from the places **barrel**.

---

## 8. Existing-feature preservation matrix

Proof during apply: Playwright MCP against `http://localhost:3000` with API up. A prettier button that drops a contract is a fail.

| Flow | Still true after UI |
|------|---------------------|
| Guest home search ≥2 chars | `GET /destinations/search?q=` |
| Select result | URL `?destination=` |
| Sparse | Generate enabled (at planner floor); warning copy |
| Below floor | Prepare; Generate off until floor |
| Generate click on home | Navigate only; no planner POST |
| Compose + generate | POST SSE; abort on cancel/unmount |
| 409 not ready | JSON gate, not SSE parse |
| Clarification | Fresh POST, not resume |
| `itinerary_done` | `/trips/{id}` then GET trip + geojson |
| Guest trip 403 | Session-mismatch copy, **no** login CTA |
| Auth trip 403 | Ownership copy |
| Map fail | List remains |
| Guest `/trips` | Login CTA, no fake list |
| Day-edit | Owner only; no optimistic UI; no mutation retry |
| Narrative | markdown + GFM only |

---

## 9. Module map (implementation guide)

| Concern | Home |
|---------|------|
| Tokens, fonts, layout chrome | `app/globals.css`, `app/layout.tsx`, `components/layout/*`, shadcn add |
| Header nav | `features/auth/session-header.tsx` (still no destinations/trips HTTP) |
| Home hero + search/readiness restyle | `features/destinations/*` |
| Compose/progress restyle | `features/planner/*` |
| Trips list/detail/map restyle | `features/trips/*` |
| Places cards (picker + explore live) | `features/places/*` public barrel |
| Explore route + mock + geolocation | `features/explore/*`, `app/explore/page.tsx` |
| HTTP | **No new domain file** until OpenAPI has nearby. Live explore uses places module already in `lib/api/places.ts` |

`docs/app/system.md` snapshot update at ship. Do not rewrite `docs/blueprint.md` principles 1–16. Optional short pointer in blueprint “as-built UI” is fine if it does not change wire rules.

---

## 10. Non-goals

- Backend nearby/radius route, reverse geocode, or place photos
- Chat-style planner shell, bookings, reviews, likes
- Add-to-trip from Explore
- F7 Vitest, `@playwright/test` CI, Sentry
- OAuth `FRONTEND_URL` bounce (backend)
- Inventing trip titles/destination names missing from `TripOut`
- New `NEXT_PUBLIC_*` except existing API + map style

---

## 11. Suggested apply batches

1. **Design tokens + shell + nav** (Explore/Trips links; Search contract unchanged)
2. **Home + generate restyle** (contracts proven)
3. **Trips list + detail split layout** (403/map/list-first proven)
4. **Explore Nearby** live destination feed + mock GPS + empty states
5. **Responsive + a11y smoke** (keyboard, 375 width, Playwright MCP)

Each batch must leave prior flows green.

---

## 12. Later (out of this change)

When FastAPI exposes a nearby search in OpenAPI: regenerate `types/generated/api.d.ts`, add `lib/api` method, point `ExploreFeedProvider` at it, delete or gate the mock. Until then, mock stays labeled **Preview**.
