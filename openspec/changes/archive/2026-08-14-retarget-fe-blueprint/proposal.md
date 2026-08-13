## Why

`docs/blueprint.md` still assumes a greenfield sibling repo (`wandr-web/`) and old filenames (`FE_guide.md`, `blueprint_frontend.md`). This repo is already the Next.js frontend. A literal F0.1 reading can scaffold a second app or look up docs that do not exist here. Patch the blueprint now, before any F-step, so later slices cannot take that path.

## What Changes

- Add a short **this-repo** box at the top of `docs/blueprint.md`: this directory is the FE app; wire contract is `docs/frontendGuide.md`; backend bible is `docs/impSpec.md`; do not create another Next.js app.
- Rewrite **F0.1** as a retarget of the existing scaffold (replace default page/README, write FE guardrails into `AGENTS.md`, add empty feature folders). Proof becomes: tree + guardrails + existing `npm run dev` — not `create-next-app`.
- Mark **already-installed** rows in the package install table (Next.js, React, TypeScript, ESLint, Tailwind v4).
- Pin the guardrail filename for this repo as `AGENTS.md` (Cursor/Next convention). Paste-block content stays; do not spawn a second `AGENT.md`.
- Add one deferred/verify line: confirm `POST /trips/{id}/claim` and `itinerary_done.trip_id` against live OpenAPI in F0.6 — do not invent wire shapes in this patch.

No phase-order, stack, failure-contract, or API-example rewrite. Empty `docs/steps/StepF*.md` files are out of scope (fill later or ground OpenSpec slices on the blueprint).

## Capabilities

### New Capabilities

None. Docs-only retarget; no application behavior.

### Modified Capabilities

None. `skip_specs: true` is set on this change.

## Impact

- **Touched:** `docs/blueprint.md` only (v1.1.1 repo-retarget header + F0.1 + install table + deferred verify line).
- **Not touched:** application code, `package.json`, `app/`, `AGENTS.md` content (that lands in F0.1 of a later change), `docs/frontendGuide.md`, `docs/impSpec.md`, `docs/steps/StepF*.md`.
- **APIs / deps:** none.
- **Risk if skipped:** first apply of F0 follows “create sibling repo” and duplicates or wrecks the existing scaffold.
