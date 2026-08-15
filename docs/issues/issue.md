# Issue log — generate timeout and related blockers

**Date:** 2026-08-15  
**Repo:** `guideagent-frontend` (Next.js). Timeout **fix** belongs in sibling API repo `guideagent`.  
**Status:** live generate repro is **paused**. Backend Docker was stopped by the operator. Do not retry generate until `http://127.0.0.1:8000` is healthy (same origin as `NEXT_PUBLIC_API_URL`).

Do not paste LLM, MapTiler, OAuth, or other secret values into this file.

---

## 1. Generate timeout (primary)

Guest `POST /planner/generate` on destination `458854b1-4d2a-4d02-8901-e26ed59c0c8b` streamed SSE progress (`tool_done` / batch complete), then ended with terminal SSE `error` code **`generation_timeout`**.

Observed while the API was up (re-check after Docker restart; counts may drift):

| Fact | Value |
|------|--------|
| Destination | `458854b1-4d2a-4d02-8901-e26ed59c0c8b` |
| Places | 132 |
| Readiness | `tier=limited` (generate is still allowed; not a 409 `destination_not_ready`) |
| What the UI showed | “Generation failed” + the error code; no auto-retry |
| Contract | `docs/frontendGuide.md`: `generation_timeout` means the graph hit `PLANNER_GENERATION_TIMEOUT_SECONDS` |

**Frontend is doing the right thing.** Compose (`features/planner/compose-form.tsx`) already maps SSE `error` to a terminal panel. Planner spec forbids auto-retry. Waiting longer on the same POST, raising the browser `AbortSignal`, adding LLM keys to Next.js, or treating this as an F6 day-edit bug will not produce a trip.

**Owner:** API planner graph / LLM path in `guideagent`. Exact timeout seconds and which node expired are API-repo facts to fill in when Docker is up.

**Not the cause:**

- Missing `NEXT_PUBLIC_*` keys (FE only needs `NEXT_PUBLIC_API_URL` and map style)
- F6 places picker / day-edit mutations
- A hung `fetch` that never received SSE
- Guest vs logged-in for *starting* generate (guest generate is allowed)

---

## 2. Related traps (do not retry these as generate fixes)

### 2.1 Destination id ≠ trip id

`458854b1-4d2a-4d02-8901-e26ed59c0c8b` is a **destination**.

- `/generate?destination=458854b1-…` is the compose URL
- `GET /api/v1/places?destination_id=458854b1-…` → 200 (catalog)
- `GET /api/v1/trips/458854b1-…` → **404** (“Trip not found”)
- Day-edit needs `/trips/{trip_id}` where `trip_id` comes from `itinerary_done` or My trips after login

### 2.2 Session ownership

| Trip | Notes |
|------|--------|
| `39566c35-417e-4bfc-aea3-8a6647239059` | Same destination, unclaimed, **other session**. Guest GET → **403** guest-mismatch (distinct copy from generic ownership 403; no “log in to fix”). |
| `797b76ee-db5c-4c7c-a8eb-5dd997746d63` | Same destination, **claimed**. Needs Google login as the **owner**. |

Do **not** inject a `wandr_session` UUID to impersonate ownership. The cookie is not a raw session id; `localhost` vs `127.0.0.1` also splits cookies. Use owner login or a generate that finishes in the **same** browser session.

### 2.3 FE `.env` vs API secrets

The Next.js app does not send LLM / MapTiler / OAuth secrets on `POST /planner/generate`. Those belong in the **API** `.env`. If the FE `.env` also contains backend secrets, they are unused here. Do **not** copy them into `NEXT_PUBLIC_*`.

---

## 3. How to fix generate (API first)

When Docker is back:

1. **Health** — API responds at `http://127.0.0.1:8000` (match `NEXT_PUBLIC_API_URL`).
2. **Readiness** — destination still `ready` / `limited` / `sparse` (all allow generate). HTTP 409 `destination_not_ready` is a different failure.
3. **API settings** (not FE) — `PLANNER_GENERATION_TIMEOUT_SECONDS`, LLM base URL and keys, NVIDIA/gateway latency.
4. **Logs** — one generate against `458854b1-…`: which graph node is running when the budget expires; cache vs cold path.
5. **Distinguish** — `generation_timeout` (SSE terminal error) vs `llm_unavailable` (HTTP 503, no SSE) vs proxy buffering the stream.
6. **Then** — only after `itinerary_done` with a non-empty `trip_id`, open `/trips/{trip_id}` in **that same browser session**.

Cache-warm of the destination can make a later generate faster. It is an **accelerator**, not the diagnosis. Timeout still means the graph budget is too tight or the LLM path is too slow.

Do **not** “fix” this by lengthening the FE abort. Aborting later leaves the API generating (and billing tokens) after the tab gave up.

Optional later (this repo, **not** this log’s apply): clearer copy that the planner timed out on the API. Still no auto-retry. Do not edit `compose-form.tsx` until the API path is actually healthy and the copy is still unclear.

---

## 4. F6 Playwright workarounds

Change `implement-fe-step-f6` tasks **3.1–3.2 are not done**. Picker + add/duplicate/reorder/remove need `GET /trips/{id}` **200** for *this* session.

Until generate succeeds:

1. Log in as the owner and open `http://localhost:3000/trips/797b76ee-db5c-4c7c-a8eb-5dd997746d63`, or
2. After the API timeout is fixed, finish a guest generate in the same browser, then use that `trip_id`.

Do not mark F6 shipped from this file.
