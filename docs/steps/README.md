# Wandr FE — step playbooks

Execution interface for F0–F7. Product SSOT remains [`docs/blueprint.md`](../blueprint.md). Wire contract: [`docs/frontendGuide.md`](../frontendGuide.md).

## Two grains (do not collapse)

| Grain | Unit | Where |
|-------|------|--------|
| **Write** | One fenced prompt per sub-step | `StepFN.md` |
| **Run** | 2–3 of those prompts in one agent/CLI session | `batches/` |

Merging several sub-steps into a **single prompt body** is how later items get sloppy. Grouping them into **one session** is fine if the batch file lists order and a hard stop.

## How to run

1. Confirm the previous batch’s proofs passed (or this is F0a).
2. **CLI / agent:** point the session at **one** file under `batches/` (for example `docs/steps/batches/F0a.md`). That file tells the agent which `StepFN.md` sections to read.
3. **Chat paste:** copy **one** fenced prompt from `StepFN.md`. Do not paste the whole phase file.
4. After the agent finishes, run the listed validation yourself. Only then start the next batch.
5. If the agent jumps ahead, adds packages not listed, or skips a failure boundary: stop. Paste the correction note at the bottom of that prompt and re-run.

Do **not** start F{n+1} until that phase’s ship checklist is green. Expand `StepF4.md`–`StepF7.md` from outlines into full prompts only after the previous phase ships.

## F0 batches (this repo)

| Batch | Sub-steps | Needs |
|-------|-----------|--------|
| [`batches/F0a.md`](batches/F0a.md) | 0.1 → 0.2 | nothing beyond this repo |
| [`batches/F0b.md`](batches/F0b.md) | 0.6 → 0.3 | local API up (`GET /openapi.json`) |
| [`batches/F0c.md`](batches/F0c.md) | 0.5 → 0.4 | F0a + F0b green |

Blueprint numbers (0.3, 0.4, 0.6, …) are unchanged. **Run order** is dependency-correct: type-lock before the client; shadcn before providers.

## F1 batches (this repo)

| Batch | Sub-steps | Needs |
|-------|-----------|--------|
| [`batches/F1a.md`](batches/F1a.md) | 1.1 → 1.2 | F0 ship green; local API up (`GET /api/v1/auth/me`) |
| [`batches/F1b.md`](batches/F1b.md) | 1.3 | F1a green |

Blueprint numbers 1.1–1.3. **Run order** is numeric. HTTP module before chrome so the header never owns fetch.

## F2 batches (this repo)

| Batch | Sub-steps | Needs |
|-------|-----------|--------|
| [`batches/F2a.md`](batches/F2a.md) | 2.1 | F1 ship green; local API up (`GET /api/v1/destinations/search?q=Da`) |
| [`batches/F2b.md`](batches/F2b.md) | 2.2 | F2a green |

Blueprint numbers 2.1–2.2. **Run order** is numeric. Search HTTP before readiness so the header never owns destinations fetch and `sparse` is not hard-blocked.

## F3 batches (this repo)

| Batch | Sub-steps | Needs |
|-------|-----------|--------|
| [`batches/F3a.md`](batches/F3a.md) | 3.1 | F2 ship green; local API up; a selectable destination (or `?destination=` uuid) |
| [`batches/F3b.md`](batches/F3b.md) | 3.2 | F3a green; API accepts `POST /planner/generate` (SSE or 409); abort proof needs API logs |
| [`batches/F3c.md`](batches/F3c.md) | 3.3 | F3b green including server-side abort-integrity |

Blueprint numbers 3.1–3.3. **Run order** is numeric. Compose before SSE so invalid forms never POST. F3.2 is its own session so abort-integrity is not skipped. Expand F3 only after F2 ship (already true).

## This repo

Workspace root is `guideagent-frontend`. It **is** the Next.js app. Playbooks must never instruct `create-next-app` or a nested `wandr-web/` folder. Guardrails file is `AGENTS.md` (not a second `AGENT.md`).

Validation commands in prompts are **PowerShell-first** (this repo is developed on Windows). Unix equivalents are optional.
