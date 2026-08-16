## 1. Types and JSON 202

- [x] 1.1 Prove the sibling API is up at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`): `GET /openapi.json` includes `POST /api/v1/destinations/{destination_id}/prepare` and `GET /api/v1/health` succeeds. If either fails, **stop** — do not hand-write `DestinationPrepareOut` or stub the path
- [x] 1.2 Run `npm run gen:types` and commit the regenerated `types/generated/api.d.ts`. Confirm generated schemas include prepare-out (`status` `ready` | `preparing`, `place_count`) and the prepare path key. Do not hand-edit the generated file
- [x] 1.3 Confirm `lib/api/client.ts` `sendJson` treats HTTP 202 + success `ApiResponse` as success (`res.ok` / no status===200-only check) and still uses the default ~20s JSON timeout. Change the gateway only if 202 currently throws; do not lengthen the timeout for Overpass

## 2. Destinations HTTP and hooks

- [x] 2.1 Add `prepareDestination(id, signal)` in `lib/api/destinations.ts`: `PREPARE_PATH = "/api/v1/destinations/{destination_id}/prepare" satisfies keyof paths`; `sendJson` POST, `parse: "api"`, credentials via gateway, pass `AbortSignal`, omit body (`radius_km` default). Export generated prepare-out type. MUST NOT auto-retry. Search MUST remain GET-only (no prepare on search)
- [x] 2.2 Add `features/destinations/use-destination-prepare.ts`: `useMutation`, `retry: none`, Query key invalidation of `["destinations","readiness", id]` on 200 `ready`. Surface 429 / `rate_limit_exceeded` vs other errors. Do not import planner HTTP or SSE
- [x] 2.3 Extend `use-destination-readiness.ts` so a caller can poll: `refetchInterval` ~2s only while preparing, stop when `place_count >= 10` or ~120s elapsed or id changes/unmount. First sparse/zero poll is not an error. Keep `retry: 1` for the initial GET. Do not use Zustand

## 3. Readiness card — floor gate and Prepare

- [x] 3.1 Update `readiness-card.tsx`: UI floor **10**. If `place_count >= 10`, keep Generate as a `Link` to `/generate?destination=` (enabled for `ready` / `limited` / `sparse`; limited/sparse messages unchanged). If `place_count < 10`, disable/hide Generate as the primary action and show Prepare. Empty score/places after select is expected copy, not not-found. MUST NOT import planner SSE or POST generate. MUST NOT auto-prepare on mount or on search select
- [x] 3.2 Wire Prepare: guest-reachable button, no login wall. On 200 `ready` → refetch readiness. On 202 `preparing` → show preparing state and start poll. On 429 → existing toast + brief Prepare disable (~2s). On network/5xx → toast + retry, not an infinite spinner. After ~120s still below floor → “not enough places” (no login CTA). Search results MUST NOT POST prepare
- [x] 3.3 Confirm `features/destinations/index.ts` barrels the new hook if the card needs it, `app/page.tsx` still mounts destinations UI only (no `getJson` / `sendJson` / `useQuery` on the page), and `session-header` still does not import destinations HTTP

## 4. Planner 409 copy

- [x] 4.1 Update the compose 409 `destination_not_ready` panel copy so it is clearly a place-floor / prepare issue, with `Link` to `/?destination=`. MUST NOT prompt Google login as the fix. MUST NOT import `lib/api/destinations` or start prepare from `/generate`

## 5. Docs

- [x] 5.1 Sync `docs/frontendGuide.md` from `docs/update_backend.md` (search → prepare → poll ~2s/~120s → guest generate; prepare 200/202; limiter 5/min/IP; no `search_available`; DTO `PrepareIn` / `DestinationPrepareOut`). Leave one canonical FE guide
- [x] 5.2 Update `docs/blueprint.md` Failure Boundary: 409 `destination_not_ready` → prepare/poll, not login. Clarify F2.2: do not hard-block `sparse` when `place_count` meets the floor; gate Generate on the floor
- [x] 5.3 Snapshot `docs/app/system.md` (prepare client, floor gate, poll). Do not expand OAuth, F6, or invent evaluation HTTP

## 6. Verify

- [x] 6.1 Browser, guest, no Google login: search a new place (search has no prepare POST) → select → readiness with low/zero `place_count` → Prepare → 200 skip-wait or 202 + polls ~2s → Generate enables at `place_count >= 10` → compose. A destination already at the floor still shows Generate without requiring Prepare
- [x] 6.2 Confirm: search select does not POST prepare; sparse with `place_count >= 10` still navigates to compose; 409 on generate still JSON-not-SSE and links home without a login wall; Network has no `EventSource`. Optional: trigger prepare 429 and confirm toast + brief disable
