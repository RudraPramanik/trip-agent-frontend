## Context

See `proposal.md` for why. Frontend compose already maps SSE `error` (including `generation_timeout`) to a terminal panel and does not auto-retry (`features/planner/compose-form.tsx`, `openspec/specs/planner/spec.md`). `docs/frontendGuide.md` defines `generation_timeout` as the graph hitting `PLANNER_GENERATION_TIMEOUT_SECONDS`.

Observed while the API was up (now stopped by the operator):

| Fact | Value |
|------|--------|
| Destination | `458854b1-4d2a-4d02-8901-e26ed59c0c8b` |
| Places | 132; readiness `tier=limited` (generate still allowed) |
| Guest generate | SSE progress (`tool_done` / batch complete) then terminal `generation_timeout` |
| Same UUID as trip | `GET /trips/{id}` → 404 — it is a destination, not a trip |
| Existing DB trip (other session) | `39566c35-417e-4bfc-aea3-8a6647239059` → GET 403 guest-mismatch |
| Existing claimed trip | `797b76ee-db5c-4c7c-a8eb-5dd997746d63` — needs Google login |
| Cookie spoof | Injecting a `wandr_session` UUID did not unlock the 403 |

Constraint: this change writes `docs/issues/issue.md` only. The FastAPI timeout fix is in sibling repo `guideagent`. Do not invent FE endpoints, LLM keys, or a “resume stream” path.

## Goals / Non-Goals

**Goals:**

- One issue log an agent can follow without replaying the F6 chat.
- Separate **symptoms** (what FE showed) from **owners** (API vs FE vs operator infra).
- Sequence a generate investigation that starts with “is Docker/API up?” then LLM/timeout/destination path — not “wait longer on the same POST.”
- List F6 workarounds that do not require a successful generate.

**Non-Goals:**

- Fixing FastAPI, LLM gateway, or Docker compose from this repo.
- Changing planner UX, timeouts, or auto-retry (already forbidden).
- Completing `implement-fe-step-f6` tasks 3.1–3.2.
- Copying backend secrets from FE `.env` into `NEXT_PUBLIC_*`.
- Reproducing generate while Docker is down.

## Decisions

### 1. Single file `docs/issues/issue.md` as the apply output

Write one markdown issue log. Do not split into tickets, GitHub issues, or extra OpenSpec specs. The file is empty today; apply overwrites it with the full log.

**Alternative considered:** Patch `docs/steps/StepF6.md` or F3. Rejected — those are phase checklists; this is an incident + investigation note.

**Alternative considered:** OpenSpec delta on `planner`. Rejected — product requirements already cover timeout UX. `skip_specs: true`.

### 2. Treat `generation_timeout` as an API graph timeout, not an FE client timeout

The browser received SSE frames, then a terminal `error` with `code: generation_timeout`. That is the planner graph budget, not a hung `fetch`, missing MapTiler/Auth0 key, or F6 day-edit code. The issue log MUST say: do not raise FE AbortSignal length as the fix; do not add LLM keys to Next.js.

**Alternative considered:** Document “increase the browser timeout.” Rejected — aborting later would not change `PLANNER_GENERATION_TIMEOUT_SECONDS` on the server; it would only leave the API generating after the tab gave up.

### 3. Investigation order (copy into the issue log)

When Docker is back:

1. Confirm API health at `http://127.0.0.1:8000` (same origin the FE uses via `NEXT_PUBLIC_API_URL`).
2. Confirm destination still ready enough (`limited`/`ready`/`sparse` all allow generate; 409 `destination_not_ready` is a different failure).
3. In **API** `.env` / settings (not FE): `PLANNER_GENERATION_TIMEOUT_SECONDS`, LLM base URL and keys, NVIDIA/gateway latency.
4. Watch API logs for the same generate: which node is running when the budget expires; cache vs cold path for destination `458854b1-…`.
5. Distinguish `generation_timeout` from `llm_unavailable` (HTTP 503, no SSE) and from proxy buffering.
6. Only after a successful `itinerary_done` with `trip_id`, resume F6 Playwright on `/trips/{trip_id}` in **that same browser session**.

**Alternative considered:** Cache-warm as the only fix. Record as a possible accelerator, not the diagnosis — timeout still means the graph budget is too tight or the LLM path is too slow.

### 4. Document ID and session traps so they are not retried as generate fixes

- Destination id ≠ trip id. `/generate?destination=` vs `/trips/{trip_id}`.
- Guest cannot open another session’s unclaimed trip (distinct 403 copy; no “log in to fix”).
- Claimed trip `797b76ee-…` is a valid F6 workaround **after Google login as the owner**.
- Do not inject `wandr_session` as a raw UUID to impersonate ownership (`localhost` vs `127.0.0.1` also splits cookies).

**Alternative considered:** Instruct agents to copy session cookies into Playwright. Rejected — ownership is API-enforced; the issue log should not become an access-bypass playbook. Use login or a same-session generate.

### 5. FE `.env` may contain backend secrets; the issue log must not echo them

The frontend only consumes `NEXT_PUBLIC_API_URL` (and map style). LLM / MapTiler / OAuth secrets in a FE `.env` do not feed `POST /planner/generate`. The log warns not to copy them into `NEXT_PUBLIC_*` and not to paste secret values into the doc.

**Alternative considered:** List which keys were present. Rejected — leak risk; name the classes of vars only.

### 6. Optional FE copy is later, not this apply

A clearer “planner timed out on the API; retry after backend is healthy” line is optional product polish. This change does not edit `compose-form.tsx`. If generate still times out after the API budget/LLM path is fixed, then consider copy — still no auto-retry.

## Risks / Trade-offs

- [Docker is down; numbers may drift] → Mitigation: log IDs and symptoms as of 2026-08-15; tell the reader to re-check readiness/places after API restart.
- [Agents implement FastAPI from this FE change] → Mitigation: tasks.md only writes `docs/issues/issue.md`; design Non-Goals name the sibling repo.
- [Issue log treated as “FE is broken”] → Mitigation: lead with contract-correct FE behavior, then API ownership.
- [F6 3.1 still red] → Mitigation: list login-to-claimed-trip workaround; do not mark F6 shipped in this file.

## Migration Plan

1. Write `docs/issues/issue.md` in one apply.
2. No deploy, no env change, no runtime.
3. Rollback: empty or revert that file.

## Open Questions

None that block the log. Exact `PLANNER_GENERATION_TIMEOUT_SECONDS` and which graph node expired are API-repo facts to fill in when Docker is up — they do not change this change’s tasks.
