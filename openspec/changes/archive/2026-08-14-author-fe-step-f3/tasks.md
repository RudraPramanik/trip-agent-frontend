## 1. F3 phase bible

- [x] 1.1 Replace `docs/steps/StepF3.md` outline with the phase header from `_template.md`: how to use, F2-ship prerequisites, conventions, architecture (modular layers from `design.md`), locked decisions (`/generate?destination=`, SSE in `lib/sse/planner.ts` not `sendJson`/`EventSource`, real `AbortController` in `fetch`, 409 is not SSE, clarification is a fresh POST, Zustand at 3.3 only, no Vitest/motion, `lib/api/planner.ts` stays stub), failure table, feature buildup, LLD patterns, recommended batches F3a/F3b/F3c. Cite `docs/app/system.md` (F2 as-built) and principle #16.
- [x] 1.2 Add the fenced prompt for **Step 3.1** (compose `PlanRequest` on `/generate`). Lock: RHF/Zod already installed (do not reinstall); Zod mirrors generated `PlanRequest`; `destination_id` from URL; `raw_input` min 1; invalid → visible errors and no fetch; `app/generate/page.tsx` mounts barrel only; readiness Generate becomes a `Link` to `/generate?destination=` (destinations feature still MUST NOT POST generate). Do NOT jump to SSE. PowerShell VALIDATION.
- [x] 1.3 Add the fenced prompt for **Step 3.2** (abortable SSE client). Lock: `lib/sse/planner.ts` raw `fetch` + ReadableStream parser; `AbortController` passed into `fetch`; abort on unmount/Cancel; no `EventSource`; no `sendJson`/`getJson`; no 20s gateway timeout; 409 `destination_not_ready` parsed as JSON error not SSE; wire compose submit to a crude generating/cancel surface; SSE fixtures under `lib/sse/fixtures/`; no Vitest/motion. VALIDATION includes the **server-side** abort-integrity proof. Do NOT jump to progress/clarification UI.
- [x] 1.4 Add the fenced prompt for **Step 3.3** (progress + terminals + clarification). Lock: progress panel (cache hit without `tool_*` OK); terminals `itinerary_done` / `error` / `clarification_needed`; navigate `/trips/{trip_id}` only when `trip_id` present; stub `app/trips/[id]/page.tsx` (no `GET /trips/{id}`); inline clarification + `buildClarificationRawInput` + fresh POST + new AbortController + reset progress; install `zustand` once for `store/narrative.ts` Option A. End with F3 ship checklist. PowerShell VALIDATION. Do NOT start F4.

## 2. CLI batches

- [x] 2.1 Write `docs/steps/batches/F3a.md` (3.1): F2-ship + API-up prerequisites, read pointers into `StepF3.md`, session rules (no new packages, no SSE, Generate is a Link), hard stop, proofs. Do not inline prompt bodies.
- [x] 2.2 Write `docs/steps/batches/F3b.md` (3.2): F3a-green prerequisite, abort-integrity + no EventSource + no `sendJson` rules, hard stop, proofs. Do not start 3.3.
- [x] 2.3 Write `docs/steps/batches/F3c.md` (3.3): F3b-green prerequisite (including abort proof), clarification-as-fresh-POST + stub trip route + Zustand-once rules, hard stop, proofs, pointer at F3 ship checklist. Do not start F4.

## 3. Runner index

- [x] 3.1 Update `docs/steps/README.md` with an F3 batches table (F3a, F3b, F3c) next to the F2 table. Keep write grain vs run grain. Leave `StepF4.md`–`StepF7.md` as outlines. Note that F3 expansion happens only after F2 ship (already true).

## 4. Built-so-far pointer

- [x] 4.1 Keep `docs/app/system.md` as the F2 snapshot (search, readiness, non-fetching Generate, planner stubs). Do not rewrite it as if F3 code existed. `StepF3.md` header must cite it as “built so far.”

## 5. Docs-only guard

- [x] 5.1 Confirm no application files changed (`lib/sse/planner.ts`, `lib/api/planner.ts`, and `features/planner/index.ts` still stubs; `package.json` has no `zustand` / `motion` / Vitest; readiness Generate still does not POST `/planner/generate`). This change authors playbooks only.
