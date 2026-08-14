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

Do **not** start F{n+1} until that phase’s ship checklist is green. Expand `StepF1.md`–`StepF7.md` from outlines into full prompts only after the previous phase ships.

## F0 batches (this repo)

| Batch | Sub-steps | Needs |
|-------|-----------|--------|
| [`batches/F0a.md`](batches/F0a.md) | 0.1 → 0.2 | nothing beyond this repo |
| [`batches/F0b.md`](batches/F0b.md) | 0.6 → 0.3 | local API up (`GET /openapi.json`) |
| [`batches/F0c.md`](batches/F0c.md) | 0.5 → 0.4 | F0a + F0b green |

Blueprint numbers (0.3, 0.4, 0.6, …) are unchanged. **Run order** is dependency-correct: type-lock before the client; shadcn before providers.

## This repo

Workspace root is `guideagent-frontend`. It **is** the Next.js app. Playbooks must never instruct `create-next-app` or a nested `wandr-web/` folder. Guardrails file is `AGENTS.md` (not a second `AGENT.md`).

Validation commands in prompts are **PowerShell-first** (this repo is developed on Windows). Unix equivalents are optional.
