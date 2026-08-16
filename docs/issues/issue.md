# Issue log — generate timeout and related blockers

**Date:** 2026-08-15 (updated 2026-08-16)  
**Repo:** `guideagent-frontend` (Next.js). Timeout **fix** belongs in sibling API repo `guideagent`.  
**Status:** **API cold-path generate fixed and live-proved** (see BE change `fix-planner-generate-sse-terminals`). Local Turbopack FATAL on `/generate` (`Next.js package not found`) was FE-toolchain — addressed by `stabilize-generate-dev-turbopack` (`turbopack.root` + query seed). FE companion verify (`verify-generate-trip-after-api-fix`) still needs a browser pass: guest generate → navigate `/trips/{trip_id}` with API at `http://127.0.0.1:8000` matching `NEXT_PUBLIC_API_URL`.

Do not paste LLM, MapTiler, OAuth, or other secret values into this file.

---

## 0. Resolution (API) — 2026-08-16

Backend now emits cold-path terminals (`itinerary_done` / `clarification_needed` / `error`) from `PlannerService.generate`, plus `preferences_done` / `phase_changed`. Router safety net: `missing_terminal` if no terminal buffered.

**Live proof (API):** destination `458854b1-4d2a-4d02-8901-e26ed59c0c8b` (132 places, tier `limited`) → SSE `itinerary_done` with `trip_id` `0812c23f-ad08-4baf-837a-8631d21ddaf9` in ~48s wall (graph under default 45s ceiling). No `PLANNER_GENERATION_TIMEOUT_SECONDS` bump required for this run.

**Still for FE:** open `/trips/{trip_id}` from a generate completed **in that same browser session** (do not reuse another session’s trip). Then mark companion OpenSpec tasks done.

---

## 1. Generate timeout (primary — historical)

Guest `POST /planner/generate` on destination `458854b1-4d2a-4d02-8901-e26ed59c0c8b` streamed SSE progress (`tool_done` / batch complete), then ended with terminal SSE `error` code **`generation_timeout`**.

Observed while the API was up (re-check after Docker restart; counts may drift):

| Fact | Value |
|------|--------|
| Destination | `458854b1-4d2a-4d02-8901-e26ed59c0c8b` |
| Places | 132 |
| Readiness | `tier=limited` (generate is still allowed; not a 409 `destination_not_ready`) |
| What the UI showed | “Generation failed” + the error code; no auto-retry |
| Contract | `docs/frontendGuide.md`: `generation_timeout` means the graph hit `PLANNER_GENERATION_TIMEOUT_SECONDS` |

**Frontend was doing the right thing** for that failure mode. Compose already maps SSE `error` to a terminal panel. Waiting longer on the same POST, raising the browser `AbortSignal`, or adding LLM keys to Next.js will not produce a trip.

**Owner:** API planner graph / LLM path in `guideagent` — addressed by `fix-planner-generate-sse-terminals`.

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
| `0812c23f-ad08-4baf-837a-8631d21ddaf9` | Live-proof trip from API curl (2026-08-16); **not** your browser session unless generate ran there |

Do **not** inject a `wandr_session` UUID to impersonate ownership. The cookie is not a raw session id; `localhost` vs `127.0.0.1` also splits cookies. Use owner login or a generate that finishes in the **same** browser session.

### 2.3 FE `.env` vs API secrets

The Next.js app does not send LLM / MapTiler / OAuth secrets on `POST /planner/generate`. Those belong in the **API** `.env`. If the FE `.env` also contains backend secrets, they are unused here. Do **not** copy them into `NEXT_PUBLIC_*`.

### 2.4 Guest 403 after generate (session, not timeout)

If generate reaches `itinerary_done` and `/trips/{trip_id}` shows **“This trip belongs to a different session”**, that is HTTP **403** from `GET /trips/{id}` (`wandr_session` ≠ `Trip.session_id`). Backend ownership is **correct** — do not relax it, and do not treat this as `generation_timeout` or missing `NEXT_PUBLIC_*` LLM keys.

Usual causes:

- The `trip_id` came from **curl or another browser session** (including live-proof ids above). Generate again in **this** tab and only follow the id that tab navigates to.
- The app host and `NEXT_PUBLIC_API_URL` host differ (`localhost` vs `127.0.0.1`). Those are different cookie jars. Open both on the same host. Compose and the guest 403 panel show a host-mismatch hint when that is true.

---

## 3. How to verify generate (FE next)

1. **Health** — API responds at `http://127.0.0.1:8000` (match `NEXT_PUBLIC_API_URL`).
2. Open the app on the **same host** as that URL (`127.0.0.1` with `127.0.0.1`, or `localhost` with `localhost`).
3. Guest compose → generate on a ready destination.
4. Expect terminal `itinerary_done` with `trip_id` → navigate `/trips/{trip_id}` same session.
5. If `generation_timeout` returns, check API LLM latency / logs — do not lengthen FE abort as the “fix”.

---

## 4. F6 Playwright workarounds

Change `implement-fe-step-f6` tasks **3.1–3.2** still need a session-owned trip. Prefer a fresh guest generate after this API fix, then use that `trip_id`.

Do not mark F6 shipped from this file alone.
