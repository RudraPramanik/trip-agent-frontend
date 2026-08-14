## 1. F5 phase bible

- [x] 1.1 Replace `docs/steps/StepF5.md` outline with the phase header from `_template.md`: how to use, F4-ship prerequisites, conventions, architecture (modular layers from `design.md`), locked decisions (`listTrips` parse `"paginated"`, `claimTrip` parse `"api"`, `deleteTrip` parse `"empty"` / 204; Query keys `["trips","list"]` + invalidate on claim/delete; distinct claim-failure copy for unauthenticated / session-mismatch / already-claimed; no anonymous list/delete; claim best-effort until `FRONTEND_URL` bounce; **no new FE API keys** — only `NEXT_PUBLIC_API_URL`), failure table, feature buildup, LLD patterns, recommended batches F5a/F5b. Cite `docs/app/system.md` (F4 as-built) and principle #16.
- [x] 1.2 Add the fenced prompt for **Step 5.1** (my trips list). Lock: `listTrips` only (no claim/delete yet); Query key `["trips","list"]`; `app/trips/page.tsx` mounts barrel; enabled when authenticated; empty `items` → empty UI; 401 → login CTA (OAuth gap acknowledged); no fake guest list; no new packages. Do NOT jump to 5.2. PowerShell VALIDATION.
- [x] 1.3 Add the fenced prompt for **Step 5.2** (claim trip). Lock: `claimTrip` POST parse `"api"`; primary CTA on trip detail; do not claim without login; invalidate `["trips","list"]` + `["trips", id]`; distinct failure copy (401 vs session-mismatch vs already-claimed); no mutation retry; document best-effort local cookies / `FRONTEND_URL` gap. Do NOT jump to 5.3. PowerShell VALIDATION.
- [x] 1.4 Add the fenced prompt for **Step 5.3** (delete trip). Lock: `deleteTrip` DELETE parse `"empty"` (204); confirm before delete; no anonymous delete; on 204 drop list + detail (+ geojson) cache; 403/404 handling; no mutation retry. End with F5 ship checklist. PowerShell VALIDATION. Do NOT start F6.

## 2. CLI batches

- [x] 2.1 Write `docs/steps/batches/F5a.md` (5.1): F4-ship + API-up + `NEXT_PUBLIC_API_URL` prerequisites, read pointers into `StepF5.md`, session rules (list only, no claim/delete, no new packages, 401 CTA + empty UI), hard stop, proofs. Do not inline prompt bodies.
- [x] 2.2 Write `docs/steps/batches/F5b.md` (5.2 → 5.3): F5a-green prerequisite; claim then delete order; distinct claim-failure copy + 204 cache drop rules; best-effort claim note; hard stop after each fence; proofs; pointer at F5 ship checklist. Do not start F6.

## 3. Runner index

- [x] 3.1 Update `docs/steps/README.md` with an F5 batches table (F5a, F5b) next to the F4 table. Keep write grain vs run grain. Leave `StepF6.md`–`StepF7.md` as outlines. Note that F5 expansion happens only after F4 ship (already true). Mention F5 needs `NEXT_PUBLIC_API_URL` only (no new FE API keys).

## 4. Built-so-far pointer

- [x] 4.1 Keep `docs/app/system.md` as the F4 snapshot (trip detail, dual 403s, MapLibre, getTrip/getTripGeojson only). Do not rewrite it as if F5 code existed. `StepF5.md` header must cite it as “built so far.”

## 5. Docs-only guard

- [x] 5.1 Confirm no application files changed (`lib/api/trips.ts` still has only getTrip/getTripGeojson — no listTrips/claimTrip/deleteTrip; no new `app/trips/page.tsx`; `package.json` unchanged). This change authors playbooks only.
