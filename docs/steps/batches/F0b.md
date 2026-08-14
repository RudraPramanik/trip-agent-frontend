# F0b — CLI session: type-lock then gateway

> Run **this file** as the agent prompt (or paste it). Do not also paste all of `StepF0.md`.
> Prompt bodies live in [`../StepF0.md`](../StepF0.md). This file is the session gate.

## Prerequisites

- **F0a green** (Wandr `AGENTS.md`, skeleton, `.env.example`, `lib/config.ts` throws).
- Local API (`guideagent`) running. Copy `.env.example` → `.env.local` if needed:
  - `NEXT_PUBLIC_API_URL=http://localhost:8000` (no trailing slash)
- Prove API before generating types:

```powershell
Invoke-RestMethod http://localhost:8000/openapi.json | Out-Null
Invoke-RestMethod http://localhost:8000/api/v1/health
```

If either fails: **stop**. Do not run `gen:types`. Do not stub wire types from `frontendGuide.md` §14.

## Read first

1. [`../StepF0.md`](../StepF0.md) — locks (type-lock before client, envelope adapters, resilience)
2. [`../../frontendGuide.md`](../../frontendGuide.md) §6 envelopes, §8 health
3. Execute the fenced prompts in `StepF0.md` in this order only:
   - **Step 0.6** — OpenAPI type-lock
   - **Step 0.3** — `lib/api/client.ts` — Gateway + envelopes

## Session rules

- 0.6 must produce a non-empty `types/generated/api.d.ts` **before** writing client logic.
- If OpenAPI is unreachable: fail loud (“start the backend first”); never write an empty generated file.
- 0.3 uses generated types. No Vitest. No SSE. No `GET /auth/me`.
- Do **not** start 0.5 or 0.4 in this session.

## Hard stop

When 0.6 and 0.3 validations pass, **stop**. Do not continue into F0c.

## Proofs (must be green before F0c)

```powershell
npm run gen:types
Test-Path types\generated\api.d.ts
Select-String -Path lib\api\client.ts -Pattern "AbortSignal"
Select-String -Path lib\api\client.ts -Pattern "credentials"
Select-String -Path lib\api\errors.ts -Pattern "class ApiError"
Test-Path lib\api\fixtures\success.json
Invoke-RestMethod http://localhost:8000/api/v1/health
```
