## 1. Foundations (tokens, primitives, shell)

Follow `docs/feature_ui.md` and `design.md`. Read `node_modules/next/dist/docs/` for App Router / `next/font` before editing `app/layout.tsx`. Do not add `lib/api/explore.ts`. Do not install infinite-scroll, chat, or `@playwright/test` packages.

- [x] 1.1 Add only the shadcn primitives named in design.md (card, input, textarea, badge, tabs, sheet, skeleton, separator, dropdown-menu as needed). Optional display font via `next/font`. No other new runtime packages
- [x] 1.2 Apply travel tokens and product type in `app/globals.css` (light-first). Keep existing warning/destructive semantics for sparse/403/429
- [x] 1.3 Add thin `components/layout/` page frame (content width, sticky header slot). `app/layout.tsx` still wraps `AppProviders` → header → children with no auth gate
- [x] 1.4 Update `SessionHeader`: brand, Search (`Link` to home/`#destination-search`), Explore (`/explore` may 404 until §4), Trips (`/trips`), chip, Login/Logout. Header MUST NOT import destinations/places/trips/planner HTTP or render a typeahead. `/dev/ui` stays out of nav
- [x] 1.5 Verify guest header: Search does not call `/destinations/search`; Trips is a link only (no `GET /trips` from the header)

## 2. Plan + Generate restyle

Keep Query keys, debounce, planner floor, SSE, and error copy. Pages still mount barrels only.

- [x] 2.1 Restyle home (`app/page.tsx` layout + `features/destinations`) as a hero + search results + destination readiness card. Preserve min-2-char search, ~300ms debounce, `?destination=`, 429 disable, empty/404/retry, Prepare below floor, Generate = `Link` to `/generate?destination=` (no planner POST)
- [x] 2.2 Restyle compose (`features/planner`): large `raw_input`, visible days/stay, `base_lat`/`base_lng` behind disclosure but still submittable. Keep host-mismatch warning, abort/cancel, 409 gate, clarification as fresh POST, `itinerary_done` → `/trips/{id}`
- [x] 2.3 Restyle progress as a stepper driven by existing SSE events; cache hit without `tool_*` is not an error. Do not use `EventSource` or auto-retry generate
- [x] 2.4 Browser check: guest search ≥2 chars hits `GET /destinations/search`; Generate from home does not POST generate; empty `raw_input` does not POST

## 3. Trips list + itinerary layout

Do not invent `TripOut` titles or destination names. Do not synthesize GeoJSON from place lat/lng.

- [x] 3.1 Restyle `/trips` list as cards (days, status, delete). Guest/401 = login CTA, no fake list. Empty authenticated = CTA to Plan. Page still mounts trips barrel only
- [x] 3.2 Restyle trip detail as product itinerary (timeline). Wide: map beside list; narrow: list-first, map collapsed/tab/sheet using existing `TripMap` collapse. Keep claim, delete, day-edit, places picker
- [x] 3.3 Restyle places picker rows as compact cards (name, category) without changing `GET /places?destination_id=` or blanking the day list on 404/empty/error
- [x] 3.4 Keep markdown-only narrative (`react-markdown` + `remark-gfm`, no `rehype-raw`). Distinct guest 403 vs owner 403 vs 404 panels under the new layout
- [x] 3.5 Browser check: map/style failure leaves the itinerary; guest 403 has no login CTA; day-edit still owner-gated with no mutation retry

## 4. Explore Nearby

New `features/explore/` + `app/explore/page.tsx`. Live path uses the places **barrel** only. Preview ids namespaced (`preview:`). GPS only after explicit control. No add-stop from explore.

- [x] 4.1 Add explore feature folder + public barrel. Page is a Server Component that mounts the barrel only (no `getJson` / `useQuery` / `fetch`). Guest-unblocked (no required-auth)
- [x] 4.2 Compose destinations search UI on explore via the destinations barrel (not `lib/api/destinations`). Selecting a result writes `/explore?destination=` (same id as home)
- [x] 4.3 Live mode: when `destination` is set, load `usePlaces(destinationId)` and render a photo-forward feed. Filter chips (All, Cafe, Park, Viewpoint, More) against `PlaceOut.category`. All shows the full list. Empty/404/5xx = empty or retry, no invented places. Network MUST show `GET /places?destination_id=` and MUST NOT show a nearby/radius URL
- [x] 4.4 Preview mode: explicit “Use my location”; denied/timeout = dedicated panel + destination search. Bounded mock list with visible Preview badge. Mock ids MUST NOT be used as `destination_id` or `place_id` on any Wandr request. Do not persist lat/lng in `localStorage`
- [x] 4.5 Cards: category art or gradient fallback; honest alt (not “photo of this venue”); `summary` as text not HTML. Live primary CTA navigates with real `destination_id` to home or generate. Preview CTA goes to home search, never a fake uuid. No day-edit HTTP from explore
- [x] 4.6 Browser check: `/explore` as guest; live destination feed + places GET; GPS denied panel; preview labeled; no invented nearby path in the network panel

## 5. Responsive, proof, snapshot

- [x] 5.1 Phone pass (~375px): no required horizontal page scroll on Plan, Generate, Explore, trip detail; trip day list reachable if map is secondary; header controls keyboard-focusable
- [x] 5.2 Playwright MCP against `http://localhost:3000` with API up: preservation matrix in `docs/feature_ui.md` §8 plus explore live/preview/denied. If API or MCP is down, fail closed (document the blocker) — do not mark this green
- [x] 5.3 Update `docs/app/system.md` for product shell + `/explore`. Confirm no new Wandr endpoints, no `lib/api/explore.ts`, no F7 test infra, env still `NEXT_PUBLIC_API_URL` + optional map style only
