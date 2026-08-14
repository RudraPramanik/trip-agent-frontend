## 1. F5a — My trips list (5.1)

Follow [`docs/steps/batches/F5a.md`](../../../docs/steps/batches/F5a.md) and the fenced prompt **Step 5.1** in [`docs/steps/StepF5.md`](../../../docs/steps/StepF5.md). Do not add claim, delete, or day-edit. Install **no** new packages. Do not change the JSON gateway.

- [x] 1.1 Ensure `.env.local` has `NEXT_PUBLIC_API_URL` (already required; default `http://localhost:8000`) and the sibling API is up. Confirm an authenticated cookie path exists for list proofs (local Option A / Google redirect). If the API is down, **stop this section** — do not invent list DTOs. Confirm `NEXT_PUBLIC_MAP_STYLE_URL` is **not** required for this batch
- [x] 1.2 Extend `lib/api/trips.ts`: keep `getTrip` + `getTripGeojson`; add `TRIPS_LIST_PATH = "/api/v1/trips" satisfies keyof paths` and `listTrips(params?: { page?: number; size?: number }, signal?)` via `getJson` with `parse: "paginated"`. Type items as generated `TripOut`. Pass AbortSignal. Do **not** add `claimTrip` or `deleteTrip` yet
- [x] 1.3 Add `features/trips/use-trips-list.ts`: `useQuery({ queryKey: ["trips","list", …], queryFn: ({ signal }) => listTrips(…, signal), enabled: authenticated from useAuthMe, retry: 1 })`. Import `useAuthMe` from the `features/auth` barrel only — MUST NOT import `lib/api/auth`. Surface 401 / other errors for CTA / empty / retry UI
- [x] 1.4 Add `features/trips/trips-list.tsx`: success renders items (link to `/trips/{id}`); empty `items` → empty UI; unauthenticated / 401 → login CTA (reuse existing redirect to `{API}/api/v1/auth/google`). Never invent trips. Barrel-export the page-facing list view from `features/trips/index.ts`
- [x] 1.5 Add `app/trips/page.tsx` as a Server Component that mounts the trips barrel only. MUST NOT import `getJson`, `useQuery`, `fetch`, or `sendJson`. Do not wrap `/trips/[id]` in required-auth. Leave `session-header`, planner, and trip detail/map APIs unchanged (except barrel exports for list)
- [x] 1.6 Run Step 5.1 validation (PowerShell in the prompt). Browser: logged-in `/trips` → items or empty UI; guest `/trips` → login CTA, no spinning fake list; Network has `GET .../trips?page=&size=` with credentials when authenticated and **no** `/claim` or DELETE. **Hard stop** — do not start 5.2 or 5.3 in this section

## 2. F5b — Claim trip (5.2)

Follow [`docs/steps/batches/F5b.md`](../../../docs/steps/batches/F5b.md) and the fenced prompt **Step 5.2** in `StepF5.md`. Do not add delete yet. Install **no** new packages. Claim proofs may be best-effort on local cookies until API `FRONTEND_URL` bounce — do not block on production OAuth bounce.

- [x] 2.1 Keep `listTrips` / `getTrip` / `getTripGeojson`. Add `CLAIM_PATH = "/api/v1/trips/{trip_id}/claim" satisfies keyof paths` and `claimTrip(tripId, signal?)` via `sendJson` POST with `parse: "api"` → generated `TripOut`. Replace `{trip_id}`. Pass AbortSignal. Do **not** add `deleteTrip` yet
- [x] 2.2 Add `features/trips/use-claim-trip.ts`: `useMutation` with `retry: false` (or 0); onSuccess invalidate `["trips","list"]`, `["trips", id]`, and `["trips", id, "geojson"]` if used. Surface typed errors for distinct copy. MUST NOT auto-retry
- [x] 2.3 Add `features/trips/claim-trip-button.tsx` (or equivalent): authenticated + unclaimed → Claim CTA on trip detail; guest → disabled/hidden + login path. Distinct toasts/panels for 401 vs session-mismatch (“different session”, **no** login-as-fix) vs already-claimed / cannot-claim. Do not invent OpenAPI error codes. Wire via trips barrel; `app/trips/[id]/page.tsx` still MUST NOT call `sendJson` / `useMutation` directly
- [x] 2.4 Run Step 5.2 validation. Browser: guest cannot successfully claim; logged-in matching session may claim (best-effort local OK); forced failures show distinct copy. Network: `POST .../trips/{id}/claim` with credentials; **no** DELETE yet. **Hard stop** — do not start 5.3 until this validation is green

## 3. F5b — Delete trip (5.3)

Continue F5b with the fenced prompt **Step 5.3** in `StepF5.md`. Last F5 code step. Do not start F6 (no reorder / add / remove / reoptimize). Install **no** new packages.

- [x] 3.1 Keep existing trip HTTP. Add `deleteTrip(tripId, signal?)` via `sendJson` DELETE on `TRIP_PATH` with `parse: "empty"` (HTTP 204). Pass AbortSignal. Do not parse 204 as `ApiResponse` JSON. Do not add day-edit endpoints
- [x] 3.2 Add `features/trips/use-delete-trip.ts`: `useMutation` with `retry: false`; onSuccess invalidate/remove `["trips","list"]` and remove `["trips", id]` + `["trips", id, "geojson"]`; navigate away from detail when current route is that trip
- [x] 3.3 Add `features/trips/delete-trip-control.tsx` (or equivalent): confirm before delete; authenticated owner path only; guest disabled/hidden; distinct 403 ownership/forbidden vs 404 already-gone copy. Wire into list and/or detail via barrel. Pages still MUST NOT call `sendJson` / `useMutation` directly. Export from `features/trips/index.ts` as needed
- [x] 3.4 Run Step 5.3 validation. Browser: authenticated delete with confirm → 204 → trip gone from `/trips`; detail navigates away; guest cannot delete; 403/404 show distinct copy. Network: `DELETE .../trips/{id}` → 204 empty body; no day-edit routes

## 4. F5 ship — stop

- [x] 4.1 Run the full F5 ship checklist at the bottom of `docs/steps/StepF5.md` and confirm every item is green (including 401→login CTA, distinct claim failures, delete 204 cache drop, and no day-edit)
- [x] 4.2 Update `docs/app/system.md` to an F5 as-built snapshot (list + claim + delete beside F4 detail/map; no day-edit). Confirm this change did not implement day-edit, places picker, Vitest, Playwright, new FE packages, or new FE API keys. Confirm env remains `NEXT_PUBLIC_API_URL` only for F5 proofs
