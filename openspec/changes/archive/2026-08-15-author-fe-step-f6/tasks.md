## 1. F6 phase bible

- [x] 1.1 Replace `docs/steps/StepF6.md` outline with the phase header from `_template.md`: how to use, F5-ship prerequisites, conventions, architecture (modular layers from `design.md`), locked decisions (`listPlaces` parse `"paginated"`; optional `getPlace` parse `"api"`; four edit clients parse `"api"` → `TripOut`; **remove-stop is 200 not 204**; Query keys `["places", destinationId]` and invalidate `["trips", id]` + `["trips", id, "geojson"]`; no optimistic UI; no mutation retry; 401 / dual 403 / 409 duplicate / 422 / 429 20/min; guests cannot mutate; **run order 6.2 → 6.1**; **no new FE packages or API keys** — only `NEXT_PUBLIC_API_URL` required, map style optional), failure table, feature buildup, LLD patterns, recommended batches F6a/F6b. Cite `docs/app/system.md` (F5 as-built) and principle #16.
- [x] 1.2 Add the fenced prompt for **Step 6.2** (places picker) — first in file run-order even if numbered 6.2. Lock: `listPlaces` only (no day-edit mutations); Query key `["places", destinationId]`; `destination_id` from `TripOut`; 404 unknown destination does not blank the trip; empty `items` → empty UI; trips MUST NOT import `lib/api/places`; no new packages. Do NOT jump to 6.1. PowerShell VALIDATION only (no Playwright MCP yet).
- [x] 1.3 Add the fenced prompt for **Step 6.1** (edit mutations). Lock: four clients `parse: "api"`; add-stop uses 6.2 picker; up/down reorder (`ReorderStopsIn.place_ids`); remove confirms; reoptimize is JSON POST no body (not SSE); invalidate trip + geojson; `retry: false`; 401 login CTA; dual 403; 409 duplicate copy; 422; 429 backoff; no optimistic UI. End with F6 ship checklist. PowerShell VALIDATION **plus Playwright MCP last** (`browser_navigate` / snapshot / click on `/trips/{id}`: picker → add → duplicate conflict → reorder or remove; guest cannot mutate; fail-closed if MCP unavailable). Do NOT start F7. Do NOT install `@playwright/test`.

## 2. CLI batches

- [x] 2.1 Write `docs/steps/batches/F6a.md` (6.2): F5-ship + API-up + `NEXT_PUBLIC_API_URL` prerequisites, read pointers into `StepF6.md`, session rules (picker only, no day-edit mutations, no new packages, 404/empty without blanking trip), hard stop, proofs. Do not inline prompt bodies. Do not call Playwright MCP in F6a.
- [x] 2.2 Write `docs/steps/batches/F6b.md` (6.1): F6a-green prerequisite; mutations after picker; add-stop must use picker; remove-stop is 200 not 204; invalidate trip + geojson; no mutation retry; hard stop after fence; proofs; **Playwright MCP last** pointing at the 6.1 VALIDATION + F6 ship checklist. Do not start F7.

## 3. Runner index

- [x] 3.1 Update `docs/steps/README.md` with an F6 batches table (F6a = 6.2, F6b = 6.1) next to the F5 table. Note run order is picker-first (unlike numeric labels). Keep write grain vs run grain. Leave `StepF7.md` as outline. Mention F6 needs `NEXT_PUBLIC_API_URL` only (no new FE API keys); last validation is Playwright MCP, not `@playwright/test`.

## 4. Built-so-far pointer

- [x] 4.1 Keep `docs/app/system.md` as the F5 snapshot (list/claim/delete, dual 403s, MapLibre, `lib/api/places.ts` still stub). Do not rewrite it as if F6 code existed. `StepF6.md` header must cite it as “built so far.”

## 5. Docs-only guard

- [x] 5.1 Confirm no application files changed (`lib/api/places.ts` still `export {}`; `lib/api/trips.ts` still has no reorder/add/remove/reoptimize; no `features/places/`; `package.json` unchanged). This change authors playbooks only.
