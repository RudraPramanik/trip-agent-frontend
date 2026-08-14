## Why

`docs/blueprint.md` is the F-step SSOT, but `docs/steps/` is empty stubs (`StepF1.md`–`StepF7.md`, no F0). An agent cannot run F0 as a Cursor/CLI session without inventing prompt grain, order, and proofs. Author the F0 playbook now — before any F0 code — using the backend `docs/steps/stepN.md` pattern, so the first apply session has a hard stop and a proof.

## What Changes

- Add `docs/steps/README.md` (how to run: one batch file per agent/CLI session) and `docs/steps/_template.md` (required sections for later phases).
- Add `docs/steps/StepF0.md`: F0 phase bible with locked decisions, feature buildup, failure table, and **one fenced prompt per sub-step** in dependency order (0.1 → 0.2 → 0.6 → 0.3 → 0.5 → 0.4).
- Add CLI entrypoints `docs/steps/batches/F0a.md`, `F0b.md`, `F0c.md` (thin: prerequisites, ordered sub-steps, pointers into `StepF0.md`, hard stop, proofs). Prompt bodies live once in `StepF0.md`.
- Replace empty `StepF1.md`–`StepF7.md` with short outlines (feature buildup + likely run batches + “expand after F{n-1} ships”). Do not write full F1–F7 prompt bodies.

## Capabilities

### New Capabilities

None. Docs-only playbooks; no application behavior.

### Modified Capabilities

None. `skip_specs: true` is set on this change.

## Impact

- **Touched:** `docs/steps/` (README, template, `StepF0.md`, batches, F1–F7 outlines).
- **Not touched:** application code, `package.json`, `app/`, `AGENTS.md` content (that lands when F0a is applied later), `docs/blueprint.md`, `docs/frontendGuide.md`, backend repo.
- **APIs / deps:** none.
- **Follow-up:** implementing F0a/F0b/F0c is a later change after these files exist.
