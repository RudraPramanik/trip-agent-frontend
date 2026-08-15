## Why

Guest `POST /planner/generate` on destination `458854b1-4d2a-4d02-8901-e26ed59c0c8b` streams progress then ends with SSE `error` code `generation_timeout`. The frontend already shows a terminal “Generation failed” panel and does not auto-retry — that is contract-correct. The graph hit `PLANNER_GENERATION_TIMEOUT_SECONDS` on the API. Until that is diagnosed in the sibling FastAPI repo (`guideagent`), F6 Playwright cannot prove picker + day-edit on a session-owned trip. This change writes the observed issues and the proper fix path into `docs/issues/issue.md` so we do not treat the timeout as a missing frontend key, a longer wait, or an F6 bug.

## What Changes

- Fill `docs/issues/issue.md` (currently empty) with:
  - the generate timeout (symptoms, IDs, what FE already does, what the API owns)
  - related blockers: destination UUID mistaken for a trip id; guest 403 session-mismatch vs claimed trips; Playwright F6 last-step blocked
  - current infra note: backend Docker is stopped by the operator — live repro is paused until `http://127.0.0.1:8000` is up
  - a sequenced investigation / fix path for generate (API first, FE copy optional later)
  - workarounds that unblock F6 validation without pretending generate succeeded
- No application code, no new endpoints, no FE env keys, no OpenSpec product-spec deltas.

## Capabilities

### New Capabilities

None. Docs-only issue log; no application behavior.

### Modified Capabilities

None. `skip_specs: true` is set on this change. Planner already requires a terminal error panel and no auto-retry for `generation_timeout`.

## Impact

- **Touched (this change):** `docs/issues/issue.md` only.
- **Not touched:** `app/`, `features/`, `lib/`, `package.json`, `.env*`, `openspec/specs/`, `docs/blueprint.md`, `docs/frontendGuide.md`.
- **Sibling API repo (`guideagent`):** the real timeout fix lives there (`PLANNER_GENERATION_TIMEOUT_SECONDS`, LLM gateway, destination graph path). This repo documents the investigation; it does not patch FastAPI.
- **Related in-progress change:** `implement-fe-step-f6` stays separate. Tasks 3.1–3.2 remain blocked until a session-owned trip can be opened.
- **Risk if skipped:** next generate retry will be spent waiting on the same SSE timeout, or bumping FE timeouts / adding keys that the Next.js app does not use.
