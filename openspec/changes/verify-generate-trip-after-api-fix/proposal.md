## Why

Sibling API work (`guideagent` change `fix-planner-generate-sse-terminals`) will fix cold-path SSE terminals and timeout reliability. This frontend change exists so we verify guest generate → `/trips/{trip_id}` in the same session and close out `docs/issues/issue.md` — without treating Layla/PDF or F6 as the generate fix.

## What Changes

- After the API fix is green: run guest generate against a ready destination; confirm `itinerary_done` with `trip_id` and navigation to `/trips/{trip_id}`.
- Optionally improve terminal copy for `generation_timeout` (API budget, no auto-retry, no FE LLM keys) if still unclear.
- Update `docs/issues/issue.md` status when generate succeeds.
- **Non-goals:** changing SSE client architecture; inventing resume; Layla UI; day-edit F6 ship without a session-owned trip from generate.

## Capabilities

### New Capabilities

- _(none — `skip_specs: true`; verify + docs only)_

### Modified Capabilities

- _(none)_

## Impact

- `features/planner/*` compose UX (copy only if needed); `docs/issues/issue.md`.
- Depends on BE PR for `fix-planner-generate-sse-terminals`.
- Does not change `NEXT_PUBLIC_*` secret guidance.
