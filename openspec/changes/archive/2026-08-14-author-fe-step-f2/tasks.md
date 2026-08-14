## 1. Blueprint + AGENTS — modular by default

- [x] 1.1 Bump `docs/blueprint.md` to v1.1.3: header version, a “What changed vs v1.1.2” row for principle #16, and the footer source line. Additive/clarifying only — do not reorder F-steps or edit wire-contract text.
- [x] 1.2 Add **Principles #16 Modular by default** (wording from `design.md` decision 4). Add **Modular layers** to the LLD pattern table. Add a Quick Reference MUST/MUST NOT pair (mount barrels; do not dump fetch/Query keys/DTOs into layout, page, `components/`, or global `hooks/`).
- [x] 1.3 Add the matching Architecture hard rule to the blueprint `AGENTS.md` paste-block **and** to live `AGENTS.md`. Wording must match. Do not create `AGENT.md`. Do not weaken existing Feature folders / gateway bullets.

## 2. F2 phase bible

- [x] 2.1 Replace `docs/steps/StepF2.md` outline with the phase header from `_template.md`: how to use, F1-ship prerequisites, conventions, architecture (modular layers from `design.md`), locked decisions (home search vs header Link, URL `?destination=`, debounce/`q` min 2, live 20/min/IP 429, warn-and-allow, no `search_available`, RHF/Zod at 2.1 once, generate CTA enabled with no SSE), failure table, feature buildup, LLD patterns, recommended batches F2a/F2b. Cite `docs/app/system.md` and principle #16.
- [x] 2.2 Add the fenced prompt for **Step 2.1** (destinations HTTP search + Query + search field/results on home; install RHF/Zod/resolvers). Lock paths: `lib/api/destinations.ts` (`searchDestinations` only in this step), `features/destinations/use-destination-search.ts`, `search-field.tsx`, `search-results.tsx`, Query key `["destinations","search", q]`, no request if `q` < 2, debounce ~300ms, 429 toast + brief disable, empty UI. Header MUST NOT gain search fetch. Do NOT jump to readiness. PowerShell VALIDATION.
- [x] 2.3 Add the fenced prompt for **Step 2.2** (readiness HTTP + card + enabled generate CTA). Lock: `getDestinationReadiness` in `lib/api/destinations.ts`, `use-destination-readiness.ts`, `readiness-card.tsx`, Query key `["destinations","readiness", id]`, URL `?destination=<uuid>`, warn-and-allow on `limited`/`sparse`, 404 not-found, no `search_available`, generate enabled at every tier and MUST NOT call `/planner/generate`. End with F2 ship checklist. PowerShell VALIDATION.

## 3. CLI batches

- [x] 3.1 Write `docs/steps/batches/F2a.md` (2.1): F1-ship + API-up (`GET /api/v1/destinations/search?q=Da`) prerequisites, read pointers into `StepF2.md`, session rules (packages once, header stays fetch-free), hard stop, proofs. Do not inline prompt bodies.
- [x] 3.2 Write `docs/steps/batches/F2b.md` (2.2): F2a-green prerequisite, warn-and-allow + no SSE rules, hard stop, proofs, pointer at F2 ship checklist. Do not start F3.

## 4. Runner index

- [x] 4.1 Update `docs/steps/README.md` with an F2 batches table (F2a, F2b) next to the F1 table. Keep write grain vs run grain. Leave `StepF3.md`–`StepF7.md` as outlines. Note that F2 expansion happens only after F1 ship (already true).

## 5. Built-so-far pointer

- [x] 5.1 Keep `docs/app/system.md` as the F1 snapshot. Confirm destinations remain listed as stubs. Do not rewrite it as if F2 code existed. `StepF2.md` header must cite it as “built so far.”

## 6. Docs-only guard

- [x] 6.1 Confirm no application files changed (`lib/api/destinations.ts` and `features/destinations/index.ts` still stubs; `package.json` has no RHF/Zod yet; `session-header.tsx` still has no destinations HTTP). This change authors playbooks and guardrail text only.
