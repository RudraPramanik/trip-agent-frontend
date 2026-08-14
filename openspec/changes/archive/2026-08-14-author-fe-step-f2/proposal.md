## Why

F1 has shipped (cookie session probe, guest-unblocked header, Search as a `Link` to `/`), but `docs/steps/StepF2.md` is still an outline. An agent cannot run destinations search + readiness without inventing prompt grain, module boundaries, or sparse-tier copy. Author the F2 playbook now — before any destinations HTTP — and add a numbered **modular-by-default** principle to the blueprint so F2 (and later phases) cannot dump search fetch into `session-header` or `app/page.tsx`.

## What Changes

- Expand `docs/steps/StepF2.md` from outline into a full phase bible: locked decisions (domain module vs feature folder vs page mount, debounce/`q` min 2, live 20/min/IP 429, warn-and-allow on `sparse`, no invented `search_available`), failure table, feature buildup, and **one fenced prompt per sub-step** (2.1 → 2.2).
- Add CLI entrypoints `docs/steps/batches/F2a.md` (2.1) and `F2b.md` (2.2). Prompt bodies live once in `StepF2.md`.
- Refresh `docs/app/system.md` “built so far” so F2 prompts cite F1-as-built (header Search placeholder, destinations stubs).
- Update `docs/steps/README.md` with the F2 batch table. Leave `StepF3.md`–`StepF7.md` as outlines.
- Add blueprint **principle #16 (Modular by default)** plus the matching `AGENTS.md` Architecture hard rule (and the blueprint paste-block so they stay in sync). Bump the blueprint patch version (v1.1.2 → v1.1.3) with a “What changed” row. Not a product redesign.

## Capabilities

### New Capabilities

None. Docs-only playbooks and guardrail text; no application behavior. `skip_specs: true` is set on this change.

### Modified Capabilities

None. Destinations search/readiness requirements land in a later **implement** change after these files exist.

## Impact

- **Touched:** `docs/steps/StepF2.md`, `docs/steps/batches/F2a.md`, `docs/steps/batches/F2b.md`, `docs/steps/README.md`, `docs/app/system.md` (F1 snapshot pointers), `docs/blueprint.md` (principle #16 + version note), `AGENTS.md` (Architecture modularity rule).
- **Not touched:** application code (`lib/api/destinations.ts` and `features/destinations/index.ts` stay stubs until a later implement change), `package.json`, `docs/frontendGuide.md`, backend repo.
- **APIs / deps:** none in this change. F2 code (later) installs `react-hook-form`, `zod`, `@hookform/resolvers` at 2.1 and uses the F0 gateway; no packages in this authoring pass.
- **Follow-up:** implementing F2a/F2b is a later change after these files exist. Do not implement `GET /destinations/search` or readiness in this change.
