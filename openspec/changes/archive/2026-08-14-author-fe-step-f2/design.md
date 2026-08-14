## Context

See `proposal.md` for why. `docs/blueprint.md` (F2) remains the product SSOT. Wire contract is `docs/frontendGuide.md` §8 destinations and §14 `DestinationOut` / `DestinationReadinessOut` (generated types already exist). `docs/steps/StepF2.md` is an outline; `_template.md` and `StepF1.md` are the prompt-file pattern to copy. F1 code is on disk: `lib/api/auth.ts` + `features/auth/*` + `SessionHeader` (Search is a `Link` to `/`); `lib/api/destinations.ts` and `features/destinations/index.ts` are still `export {}` stubs. No RHF/Zod yet.

This change writes playbooks and a modularity principle. It does not implement destination search.

Feature folders already appear as a one-line AGENTS.md bullet and an LLD table row. That is not enough: F1 had to lock modular layers in the playbook to keep fetch out of the header. F2 is the first new domain after auth — without a numbered blueprint principle, search will land in `session-header.tsx` or `app/page.tsx`.

## Goals / Non-Goals

**Goals:**
- Same two grains as F0/F1: one fenced prompt per sub-step in `StepF2.md`; thin `F2a` / `F2b` batch files that point into it.
- Lock a modular destinations architecture in those prompts so a later implement change cannot put `getJson` in the header or parse `DestinationOut` in `app/page.tsx`.
- Name every F2 failure boundary the implementer must prove (`q` < 2, 429, empty list, 404 readiness, warn-and-allow on `sparse`).
- Add principle #16 to `docs/blueprint.md` and the matching Architecture hard rule to live `AGENTS.md` + the blueprint paste-block (keep them identical).
- Point `docs/app/system.md` at F1-as-built so F2 prompts can cite header placeholder + destination stubs.

**Non-Goals:**
- Implementing F2 application code, hooks, or search UI.
- Editing `docs/frontendGuide.md` or the backend repo.
- Expanding `StepF3.md`–`StepF7.md` beyond their outlines.
- Inventing `search_available`, hard-blocking `sparse`, calling `POST /planner/generate`, or adding Zustand.
- Changing F1 session-shell behavior (header stays fetch-free; guest Search stays reachable).

## Decisions

### 1. Two-layer files (same as F0/F1)

`StepF2.md` is the SSOT for locks, architecture, failure table, feature buildup, and one fenced prompt per sub-step. `docs/steps/batches/F2a.md` and `F2b.md` are session gates: prerequisites, read pointers, order, hard stop, proofs. They do not duplicate prompt bodies.

**Alternative considered:** Self-contained batch files that inline prompts. Rejected — two copies drift (F0 decision 1).

### 2. Batch split: F2a then F2b

| Batch | Sub-steps | Why |
|-------|-----------|-----|
| F2a | 2.1 | Domain module + search Query + search field on home. Installs RHF/Zod once. Needs local API (`GET /destinations/search`). |
| F2b | 2.2 | Readiness Query + card + generate CTA (enabled, no SSE). Selects from 2.1 results. |

Blueprint numbers stay 2.1–2.2. Run order is numeric. Search HTTP before readiness so 2.2 does not invent a second picker.

**Alternative considered:** One session for 2.1–2.2. Rejected — mixing package install, debounce, and readiness gating is how `search_available` and a hard-block on `sparse` sneak in.

### 3. Modular layers — LOCKED in the playbook (and now a blueprint principle)

Prompts must name these files and forbid crossing them:

```
lib/api/destinations.ts                      HTTP only: searchDestinations, getDestinationReadiness
                                             generated paths + DestinationOut + DestinationReadinessOut
                                             AbortSignal; credentials via gateway
                                             mirror lib/api/auth.ts / health.ts

features/destinations/use-destination-search.ts       Query key ["destinations","search", q]
features/destinations/use-destination-readiness.ts    Query key ["destinations","readiness", id]
features/destinations/search-field.tsx                input + debounce ~300ms; no request if q < 2
features/destinations/search-results.tsx              list or empty UI; select a destination
features/destinations/readiness-card.tsx              tier / score / place_count / enriched_pct /
                                                      indexed_pct / message; generate enabled every tier
features/destinations/index.ts                        public barrel only

app/page.tsx                                 mounts destinations barrel (search + results + readiness)
                                             no getJson / no Query keys / no DTO parsing

features/auth/session-header.tsx             Search stays a Link to / (guest-reachable)
                                             MUST NOT import lib/api/destinations or fire search
```

Rules the prompts (and principle #16) must repeat:

- HTTP stays in `lib/api/{domain}.ts` via the F0 gateway. Features never call `fetch` / `getJson` / `sendJson`.
- Query hooks and feature UI live in `features/{domain}/`, not a global `hooks/` dump and not `components/` (shadcn `components/ui` only).
- `app/` routes and `layout.tsx` only mount public barrels. They do not own Query keys, wire types, or debounce.
- A feature MUST NOT import another feature’s HTTP module. Cross-feature compose is page-level mounting (home mounts destinations; header stays auth chrome).
- Do not grow kitchen-sink files. Replacing the F1 Search placeholder means filling `app/page.tsx` via `features/destinations`, not stuffing typeahead into `session-header.tsx`.

**Alternative considered:** Header typeahead that calls search from `session-header.tsx`. Rejected — auth chrome would own destinations HTTP and Query keys; that is the kitchen-sink F1 already forbade.

**Alternative considered:** `hooks/use-destination-search.ts` as shared infrastructure. Rejected — destinations is not shared; AGENTS.md prefers feature folders.

**Alternative considered:** Keep search UI in `app/page.tsx` with inline `useQuery`. Rejected — the page becomes the module; F3 compose would dump onto the same file.

### 4. Principle #16 lives in the blueprint, then AGENTS.md

Add a numbered principle (next after #15):

> **16. Modular by default** — HTTP in `lib/api/{domain}.ts`; Query hooks and UI in `features/{domain}/`; `app/` and layout only mount public barrels. Do not dump fetch, Query keys, or DTO parsing into `app/layout.tsx`, `app/page.tsx`, `components/`, or a global `hooks/` folder. Features compose at the page; they do not import each other’s HTTP modules.

Mirror that as an Architecture hard rule in live `AGENTS.md` **and** in the blueprint paste-block (F0.1 source). Keep wording aligned; do not create a second `AGENT.md`.

Bump blueprint to **v1.1.3** with a “What changed vs v1.1.2” row. This is additive/clarifying, not a phase-order redesign. Also add **Modular layers** to the LLD pattern table (alongside Feature folders + Domain modules) and a Quick Reference MUST/MUST NOT pair.

**Alternative considered:** Only lock modularity inside `StepF2.md`. Rejected — the user asked for a blueprint rule, and later phases (F3 SSE, F4 map) need the same stop.

**Alternative considered:** Rewrite principle #2 or the existing Feature folders bullet instead of adding #16. Rejected — #2 is “pattern named per step”; Feature folders is a location hint. Neither states the layer split or the kitchen-sink ban.

### 5. Search lives on home; header Search stays a Link

F1 proof was “search entry reachable while guest.” F2 replaces the *home placeholder* (`app/page.tsx` “Destination search lands in F2”) with the real field. Header Search remains a `Link` to `/` (or `/#destination-search`) so guests still reach search and `features/auth` stays fetch-free.

Selected destination: URL query `?destination=<uuid>` (readable by 2.2 and later F3). Not Zustand (blueprint reserves Zustand for wizard / map / narrative).

**Alternative considered:** React state only on the page. Rejected — refresh loses selection; F3 would re-invent storage.

### 6. Wire types and Query keys — LOCKED

- `searchDestinations(q, signal)` → `GET /api/v1/destinations/search?q=` parse `"api"` → `DestinationOut[]`. Path `satisfies keyof paths`.
- `getDestinationReadiness(id, signal)` → `GET /api/v1/destinations/{id}/readiness` parse `"api"` → `DestinationReadinessOut`.
- Types from `types/generated/api.d.ts`. Do not hand-mirror `frontendGuide.md` §14. Do not add `search_available`.
- Query keys exactly as blueprint: `["destinations","search", q]` (short `staleTime` OK) and `["destinations","readiness", id]`.
- Pass the Query function’s `AbortSignal` into the domain functions.

### 7. Debounce, min length, 429 — LOCKED (2.1)

- No request when `q.trim().length < 2` (enabled query = false).
- Debounce input ~300ms (UX); live limiter is still **20/min/IP**.
- On `429` / `rate_limit_exceeded`: existing QueryCache toast + brief disable of the search control (e.g. ~2s). Proving 429 under load is optional/manual, not CI.
- Empty `data` array → empty UI (copy like “No destinations match”), never fake rows.

### 8. Readiness warn-and-allow — LOCKED (2.2)

Pinned blueprint default:

| Tier | Generate CTA | Warning |
|------|----------------|---------|
| `ready` | enabled | none |
| `limited` | enabled | inline `message` |
| `sparse` | enabled | inline `message`, more prominent (e.g. amber) |

Never `disabled={tier === "sparse"}`. 404 → not-found panel, no card. Generate CTA MUST NOT `POST /planner/generate` or open an SSE client (F3). Enabled button that preserves `?destination=` is enough; helper text may say compose is next.

**Alternative considered:** Hide Generate until F3. Rejected — blueprint proof is “generate CTA is enabled at every tier.”

### 9. Packages at 2.1, once

Install `react-hook-form`, `zod`, `@hookform/resolvers` in 2.1 (blueprint: “if not already (compose later may share)”). Search may use a small Zod schema for `q` min 2. Do not install them again in F3. No axios, no debounce package (a few lines or RHF watch is enough).

**Alternative considered:** Defer RHF to 3.1 and use a controlled input in 2.1. Allowed by the outline (“2.1 or 3.1 once”) but rejected here — installing at 2.1 matches the blueprint F2.1 📦 row and avoids a second package decision in F3.

### 10. Prompt mechanics (copy F1)

Each fence: read `AGENTS.md` + F2 locks first; TASK; FEATURE BUILDUP (EXISTS / STILL EMPTY); FAILURE MODE; LLD pattern; WHAT TO CREATE (concrete paths); RULES (Do NOT jump ahead); PowerShell VALIDATION.

F2a prerequisites: F1 ship checklist green; API up; `GET /api/v1/destinations/search?q=Da` reachable.

F2 ship checklist at the bottom of `StepF2.md` before F3 expansion: type “Da” → results or empty; no request for 1 char; debounce reduces requests; 429 path named; select → readiness fields; generate enabled on `sparse`; no `search_available`; header still has no destinations HTTP; no planner generate fetch.

Update `docs/steps/README.md` with an F2 batches table. Leave F3–F7 outlines.

`docs/app/system.md` already says F1 as-built. Authoring pass only adds a pointer that F2 prompts should cite it; do not rewrite the snapshot as if F2 code existed. After a later implement change, the snapshot updates — not in this change.

## Risks / Trade-offs

- [Agent implements F2 code while writing the playbook] → Mitigation: every task and batch file restates docs-only; `lib/api/destinations.ts` must still be a stub when this change archives.
- [Agent pastes the whole `StepF2.md`] → Mitigation: header + README: one fence or one batch file.
- [2.1 prompt puts search in `session-header.tsx`] → Mitigation: locked layers; VALIDATION greps header for `destinations/search` / `getJson` (expected: no matches).
- [2.2 invents `search_available` or disables Generate on `sparse`] → Mitigation: locked table; VALIDATION greps `search_available` (expected: no matches) and forbids `disabled` tied to `sparse`.
- [2.2 starts planner SSE] → Mitigation: forward lock; VALIDATION: no `planner/generate` in destinations feature or `app/page.tsx`.
- [RHF installed in both 2.1 and 3.1] → Mitigation: 2.1 is the one install; F3 outline will say “if not already.”
- [Principle #16 drifts between blueprint paste-block and live AGENTS.md] → Mitigation: one task edits both in the same change; wording must match.
- [Local API down during later implement] → Mitigation: F2a prerequisites list API up; authoring this playbook does not need the API.

## Migration Plan

Docs-only. No deploy. Rollback = restore the F2 outline, delete `F2a.md` / `F2b.md`, revert the README F2 table, revert principle #16 / v1.1.3 notes / AGENTS.md Architecture bullet.

## Open Questions

None. Batch split, home vs header search, URL `?destination=`, RHF at 2.1, warn-and-allow, and principle #16 wording are locked above.
