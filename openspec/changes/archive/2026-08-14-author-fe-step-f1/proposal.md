## Why

F0 has shipped (gateway, generated types, Query + toaster, Wandr `AGENTS.md`), but `docs/steps/StepF1.md` is still an outline. An agent cannot run F1 without inventing prompt grain, module boundaries, or OAuth-gap copy. Author the F1 playbook now — before any session-shell code — so the apply session has a hard stop, a proof, and locked layers (`lib/api/auth` vs `features/auth` vs layout chrome).

## What Changes

- Expand `docs/steps/StepF1.md` from outline into a full phase bible: locked decisions (cookie client, modular auth, guest-unblocked chrome), failure table, feature buildup, and **one fenced prompt per sub-step** (1.1 → 1.2 → 1.3).
- Add CLI entrypoints `docs/steps/batches/F1a.md` (1.1 → 1.2) and `F1b.md` (1.3). Prompt bodies live once in `StepF1.md`.
- Add a short `docs/app/system.md` snapshot of what F0 left on disk so F1 prompts can cite “built so far” without re-deriving it.
- Update `docs/steps/README.md` with the F1 batch table. Leave `StepF2.md`–`StepF7.md` as outlines.

## Capabilities

### New Capabilities

None. Docs-only playbooks; no application behavior.

### Modified Capabilities

None. `skip_specs: true` is set on this change.

## Impact

- **Touched:** `docs/steps/StepF1.md`, `docs/steps/batches/F1a.md`, `docs/steps/batches/F1b.md`, `docs/steps/README.md`, `docs/app/system.md`.
- **Not touched:** application code (`lib/api/auth.ts` stays a stub until a later implement change), `package.json`, `AGENTS.md`, `docs/blueprint.md`, `docs/frontendGuide.md`, backend repo.
- **APIs / deps:** none. F1 code (later) uses existing TanStack Query + the F0 gateway; no new packages in this phase.
- **Follow-up:** implementing F1a/F1b is a later change after these files exist. Do not implement `GET /auth/me` or header chrome in this change.
