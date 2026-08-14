## Why

`docs/impSpec.md` was a vendored backend dump used to retarget the FE blueprint. It has been deleted. `docs/blueprint.md` (and leftover headers in `docs/frontendGuide.md`) still treat that file — and `docs/context.md` — as living in this repo. An F0 agent will grep those paths, 404, and may recreate the dump or follow backend P0–P7. Patch the pointers now, before any F-step.

## What Changes

- Retarget every **live** `docs/impSpec.md` pointer in `docs/blueprint.md` to the sibling API repo: `guideagent/docs/blueprint_final.md`. State explicitly: do not vendor the backend bible into this repo.
- Retarget the **Doc relationship** `docs/context.md` row the same way (API-repo checkpoint, not a file here). Leave the local-verification line that already says “In **API** repo” as-is aside from naming the real backend files.
- Bump the blueprint to **v1.1.2** (repo-hygiene patch, not a product redesign). Add a short “vs v1.1.1” row: impSpec removed; pointers go to the sibling repo.
- Patch `docs/frontendGuide.md` identity leftovers so it no longer claims this repo is `guideagent`, or that `docs/blueprint_frontend.md` / `docs/context.md` / `docs/fe_suggestins.md` live here. Point the phased bible at `docs/blueprint.md`; point backend checkpoint/docs at the sibling API repo.

No phase-order, stack, failure-contract, or API-example rewrite. Empty `docs/steps/StepF*.md` stay empty. `AGENTS.md` paste remains F0.1 of a later change.

## Capabilities

### New Capabilities

None. Docs-only pointer retarget; no application behavior.

### Modified Capabilities

None. `skip_specs: true` is set on this change.

## Impact

- **Touched:** `docs/blueprint.md` (v1.1.2 pointer retarget), `docs/frontendGuide.md` (header + repo-relationship identity).
- **Already done outside this change:** `docs/impSpec.md` deleted by the author; tasks only confirm it stays gone.
- **Not touched:** application code, `package.json`, `app/`, `AGENTS.md`, `docs/steps/StepF*.md`, archived OpenSpec history, `openspec/config.yaml`.
- **APIs / deps:** none.
- **Risk if skipped:** first F0 apply hunts for `docs/impSpec.md` or treats `frontendGuide.md` as living in the API repo.
