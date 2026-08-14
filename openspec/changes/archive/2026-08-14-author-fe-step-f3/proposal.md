## Why

F2 has shipped (home search, `?destination=` selection, warn-and-allow readiness, Generate CTA that must not POST). `docs/steps/StepF3.md` is still an outline. An agent cannot run compose + abortable planner SSE without inventing prompt grain, layer boundaries, or a fake stream-resume path. Author the F3 playbook now — before any `POST /planner/generate` — so F3a/F3b/F3c cannot use `EventSource`, swallow abort, or treat `clarification_needed` as an error.

This is **not** F2b. Readiness already exists on disk (`getDestinationReadiness`, `ReadinessCard`, generate enabled at every tier). The next phase is F3 playbook expansion.

## What Changes

- Expand `docs/steps/StepF3.md` from outline into a full phase bible: locked decisions (compose on `/generate`, SSE in `lib/sse/planner.ts` not `sendJson`, real `AbortController` in `fetch`, 409 `destination_not_ready` is not SSE, clarification is a **fresh** POST, narrative Option A Zustand, no Vitest/motion in this phase), failure table, feature buildup, and **one fenced prompt per sub-step** (3.1 → 3.2 → 3.3).
- Add CLI entrypoints `docs/steps/batches/F3a.md` (3.1), `F3b.md` (3.2), `F3c.md` (3.3). Prompt bodies live once in `StepF3.md`.
- Keep `docs/app/system.md` as the F2 as-built snapshot so F3 prompts cite search + readiness + non-fetching Generate. Do not rewrite it as if F3 code existed.
- Update `docs/steps/README.md` with the F3 batch table. Leave `StepF4.md`–`StepF7.md` as outlines.
- No `AGENTS.md` / blueprint principle add — streaming, abort-integrity, and clarification contracts are already hard rules. Playbook locks them into prompt grain.

## Capabilities

### New Capabilities

None. Docs-only playbooks; no application behavior. `skip_specs: true` is set on this change. Planner compose/SSE requirements land in a later **implement** change after these files exist.

### Modified Capabilities

None. `destinations` (search + readiness + non-fetching Generate) and `session-shell` stay as shipped. F3 code will later add a `planner` capability; this change does not.

## Impact

- **Touched:** `docs/steps/StepF3.md`, `docs/steps/batches/F3a.md`, `docs/steps/batches/F3b.md`, `docs/steps/batches/F3c.md`, `docs/steps/README.md`. `docs/app/system.md` stays the F2 snapshot (cite it; do not pretend F3 shipped).
- **Not touched:** application code (`lib/sse/planner.ts`, `lib/api/planner.ts`, `features/planner/` stay stubs until a later implement change), `package.json` (no Zustand / motion / Vitest here), `docs/frontendGuide.md`, `docs/blueprint.md`, `AGENTS.md`, backend repo.
- **APIs / deps:** none in this change. Later implement installs `zustand` at 3.3 (narrative Option A). RHF/Zod already present from F2. No `motion` (CSS/status text). No Vitest (F7). SSE client must not use `sendJson` (20s timeout + JSON parse would kill the stream).
- **Prerequisites (already met):** F2 as-built is on disk (search, readiness, Generate CTA without planner POST). `StepF2.md` ship checklist says expand F3 next. Generated `PlanRequest` and `POST /api/v1/planner/generate` exist in `types/generated/api.d.ts`.
- **Runtime dependency:** later implement proofs need the sibling API up, a destination that can generate, and (for the abort-integrity proof) server logs. Authoring this playbook does not need the API.
- **Follow-up:** implementing F3a/F3b/F3c is a later change after these files exist. Do not implement compose, SSE, or `/trips/[id]` in this change.
