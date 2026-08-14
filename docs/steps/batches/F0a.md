# F0a — CLI session: scaffold + env

> Run **this file** as the agent prompt (or paste it). Do not also paste all of `StepF0.md`.
> Prompt bodies live in [`../StepF0.md`](../StepF0.md). This file is the session gate.

## Prerequisites

- Workspace: `guideagent-frontend` repo root.
- Next.js scaffold already exists. **Do not** run `create-next-app`. **Do not** create `wandr-web/` or `AGENT.md`.
- F0b/F0c have **not** been started (no `openapi-typescript`, no gateway logic, no shadcn required yet).

## Read first

1. [`../README.md`](../README.md) — write grain vs run grain
2. [`../StepF0.md`](../StepF0.md) — **Locked decisions**, **Failure-mode table**, **Feature buildup**
3. Then execute the fenced prompts in `StepF0.md` in this order only:
   - **Step 0.1** — Retarget existing scaffold + directory skeleton
   - **Step 0.2** — Env example + API URL

## Session rules

- Complete 0.1, run its VALIDATION, then 0.2, run its VALIDATION.
- Do **not** start 0.6, 0.3, 0.5, or 0.4 in this session.
- No new npm packages.
- PowerShell-first proofs.

## Hard stop

When 0.1 and 0.2 validations pass, **stop**. Do not continue into F0b.

## Proofs (must be green before F0b)

```powershell
Select-String -Path AGENTS.md -Pattern "lib/api/client.ts" | Select-Object -First 1
Test-Path AGENT.md   # Expected: False
Test-Path .env.example
Select-String -Path lib\config.ts -Pattern "throw"
npm run dev          # boots; home is not the stock create-next-app marketing page
```
