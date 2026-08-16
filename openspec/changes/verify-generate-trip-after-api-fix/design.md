## Context

See sibling BE `guideagent/openspec/changes/fix-planner-generate-sse-terminals/solution-review.md`. FE already parses terminals in `lib/sse/planner.ts` and maps errors in compose. Observed failure was API `generation_timeout`, not missing FE keys.

## Goals / Non-Goals

**Goals:** Prove E2E generate → trip page after API fix; keep issue log accurate.

**Non-Goals:** Re-architect SSE; auto-retry generate; F6 Playwright ship from fake trip ids; Layla.

## Decisions

### 1. Verify after BE merge/local apply

Do not mark this change done until a cold (or warm) generate in the browser yields `itinerary_done` + navigation. Prefer `127.0.0.1` consistently for API URL and cookies.

### 2. Copy tweak is optional

Only edit compose failure copy if operators still misread timeout as an FE env bug after API is healthy.

### 3. Issue log is the FE source of truth for this incident

Update status sections; do not paste secrets.

## Risks / Trade-offs

- [Verifying before API fix] → Mitigation: tasks gated on API health + terminal success.
- [destination_id vs trip_id confusion] → Mitigation: only open `/trips/{trip_id}` from terminal payload.
