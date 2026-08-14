## Context

See `proposal.md` for why. `docs/blueprint.md` (v1.1.2) remains the product SSOT for F0–F7. Sibling API repo `guideagent/docs/steps/stepN.md` is the prompt-file pattern to copy. This repo’s `docs/steps/StepF1.md`–`StepF7.md` are empty; there is no `StepF0.md`. Application code stays create-next-app defaults (`AGENTS.md` is still the Next.js stub).

Constraint: F0.3 (gateway client) consumes `types/generated/api.d.ts` from F0.6. Blueprint allows stub-then-backfill; this playbook will not stub.

## Goals / Non-Goals

**Goals:**
- Separate write grain (one fenced prompt per sub-step) from run grain (2–3 prompts per CLI session).
- Make F0 executable via Chat paste (copy one fence from `StepF0.md`) or CLI (run one batch file).
- Sequence F0 so type-lock lands before the client.
- Leave F1–F7 as outlines so they can absorb F0 lessons.

**Non-Goals:**
- Implementing F0 application code, package installs, or OpenAPI codegen.
- Full F1–F7 prompt bodies.
- Editing `docs/blueprint.md` or `docs/frontendGuide.md`.
- Adding `docs/app/system.md` (that lands after F0 code ships).

## Decisions

### 1. Two-layer files: phase bible + thin batch entrypoints

`StepF0.md` holds locks, architecture, failure table, feature buildup, and **one fenced prompt per sub-step** (SSOT for prompt text). `docs/steps/batches/F0a.md` / `F0b.md` / `F0c.md` are CLI session files: prerequisites, ordered sub-steps, “read these sections of StepF0.md”, hard stop, proof commands. They do not duplicate prompt bodies.

**Alternative considered:** One giant `StepF0.md` only (backend Chat-paste). Rejected — CLI `agent -p file` would dump every F0 prompt into one session.

**Alternative considered:** Self-contained batch files that inline the prompts. Rejected — two copies of each prompt would drift.

### 2. Write grain vs run grain stay separate

Each sub-step is its own fenced prompt with `TASK`, feature buildup, failure mode, LLD pattern, `Do NOT jump ahead`, `VALIDATION`. Run batches group 2–3 of those prompts. Merging 0.1–0.3 into a single prompt body is forbidden (backend P1 taught that later items in a combined prompt get sloppy).

### 3. F0 run order is dependency-correct, not blueprint numeric order

| Batch | Sub-steps | Why |
|-------|-----------|-----|
| F0a | 0.1 → 0.2 | Scaffold + env; no new packages |
| F0b | 0.6 → 0.3 | Types first, then client. Requires local API. |
| F0c | 0.5 → 0.4 | shadcn scratch page, then Query/toaster providers wrap layout |

F0.5 before F0.4 so Button/toast can render before providers wrap the tree. F0.6 before F0.3 so the client imports generated types, not `frontendGuide.md` §14 stubs.

**Alternative considered:** User’s example 0.1–0.3 then 0.4–0.6. Rejected — forces type stubs and a backfill pass. The example was the batching *pattern*, not the F0 sequence.

### 4. JIT later phases

`StepF1.md`–`StepF7.md` become outlines: phase goal, feature buildup after the phase, likely run batches, “expand after F{n-1} ships.” Full fences wait until the previous phase’s ship checklist is green.

### 5. Guardrail filename stays `AGENTS.md`

F0.1 prompt pastes the blueprint block into existing `AGENTS.md`. Do not create `AGENT.md`. The paste-block heading inside the blueprint may still say `# AGENT.md`; the on-disk file is `AGENTS.md`. Keep the Next.js docs stub comment at the top of `AGENTS.md` or fold it under the Wandr rules — F0.1 prompt will say: Wandr hard rules must be present; do not delete the Next.js `node_modules/next/dist/docs/` reminder if it still applies.

### 6. Windows-friendly validation

This repo is developed on Windows (PowerShell). F0 prompts must give PowerShell-equivalent proofs (`Get-ChildItem`, `Select-String`) alongside or instead of Unix `find`/`grep`/`cat`. Backend step files already mixed both; FE prompts should prefer PowerShell as primary.

## Risks / Trade-offs

- [Agent runs a batch file without reading `StepF0.md`] → Mitigation: each batch file’s first instruction is “Read `docs/steps/StepF0.md` sections X–Y before writing any file.” Hard stop is restated in the batch file.
- [F0b blocked because local API is down] → Mitigation: F0b prerequisites list API up + `/openapi.json` reachable; type-gen script must fail loud, never write an empty file.
- [F1–F7 outlines go stale vs blueprint] → Mitigation: outlines cite `docs/blueprint.md` as SSOT and say expand-when-ready; do not duplicate full F-step bullets.
- [Chat users paste the whole `StepF0.md`] → Mitigation: README + `StepF0.md` header: paste **one** fenced prompt, or run one batch file.

## Migration Plan

Docs-only. No deploy. Rollback = delete the new `docs/steps/` files and restore empty `StepF1`–`StepF7` stubs.

## Open Questions

None. Batch order, JIT scope, and file split were decided with the user before this change.
