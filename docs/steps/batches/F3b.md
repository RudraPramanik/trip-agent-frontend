# F3b — CLI session: abortable SSE client

> Run **this file** as the agent prompt (or paste it). Do not also paste all of `StepF3.md`.
> Prompt bodies live in [`../StepF3.md`](../StepF3.md). This file is the session gate.

## Prerequisites

- **F3a green** (compose on `/generate`, Generate is a Link, invalid form does not POST, planner SSE still stub).
- Local API up and able to accept `POST /api/v1/planner/generate` (SSE **or** 409 JSON). Abort-integrity needs **API server logs**.
- No new packages. **No** `EventSource`. **No** `sendJson` / `getJson` for generate (20s JSON gateway would kill the stream).

## Read first

1. [`../StepF3.md`](../StepF3.md) — locks (Abortable SSE, 409 is not SSE, modular layers, no 20s timeout)
2. Execute the fenced prompt in `StepF3.md`:
   - **Step 3.2** — Abortable SSE client

## Session rules

- `lib/sse/planner.ts`: raw `fetch` + ReadableStream; `AbortController.signal` passed **into fetch**.
- Abort on unmount, route change, and Cancel. Reader-only stop is a **fail**.
- 409 `destination_not_ready` → JSON `ErrorResponse` panel + link to `/?destination=`. Do not parse as SSE.
- Wire compose submit to a crude Generating / Cancel surface so abort can be proved. Fixtures under `lib/sse/fixtures/`.
- `lib/api/planner.ts` stays `export {}`.
- Do **not** start 3.3 (no progress-panel, no clarification-form, no Zustand, no `/trips/[id]`).
- Do **not** install `motion` or Vitest.

## Hard stop

When 3.2 validation passes **including the server-side abort-integrity proof**, **stop**. Do not continue into F3c.

## Proofs (must be green before F3c)

```powershell
Select-String -Path lib\sse\planner.ts -Pattern "planner/generate"
Select-String -Path lib\sse\planner.ts -Pattern "EventSource|sendJson|getJson"   # Expected: no matches
Select-String -Path features\planner -Pattern "EventSource" -Recurse   # Expected: no matches
Select-String -Path app\generate\page.tsx -Pattern "getJson|sendJson|EventSource|fetch"   # Expected: no matches
Test-Path lib\sse\fixtures
Select-String -Path lib\api\planner.ts -Pattern "export \{\}"
# Browser: submit → SSE or 409 JSON; Cancel/navigate aborts the fetch
# REQUIRED: API logs show background task canceled within a few seconds (not client-only abort)
```
